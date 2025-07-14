"""
Document Processing API Routes
Handles trade document upload, extraction, and analytics
"""

from flask import Blueprint, request, jsonify, current_app
import asyncio
import os
import tempfile
from datetime import datetime
from werkzeug.utils import secure_filename
import pandas as pd
from typing import List, Dict, Optional

from models import db, Organization, Upload, ProcessedData, TradeDocument, DocumentAnalytics
from document_processor import TradeDocumentProcessor, DocumentIntelligenceAnalytics, DocumentType
import json

documents_bp = Blueprint('documents', __name__)

# Initialize processors
document_processor = TradeDocumentProcessor()
intelligence_analytics = DocumentIntelligenceAnalytics()

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'tiff', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@documents_bp.route('/api/documents/upload', methods=['POST'])
def upload_document():
    """Upload and process a trade document"""
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        org_id = request.form.get('org_id')
        doc_type = request.form.get('document_type', 'auto')
        
        if not org_id:
            return jsonify({'error': 'Organization ID is required'}), 400
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file extension
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Allowed types: PDF, images, DOC/DOCX'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        temp_dir = tempfile.mkdtemp()
        file_path = os.path.join(temp_dir, filename)
        file.save(file_path)
        
        # Create upload record
        upload = Upload(
            filename=filename,
            original_filename=file.filename,
            file_size=os.path.getsize(file_path),
            file_type=filename.rsplit('.', 1)[1].lower(),
            user_id=request.form.get('user_id', 'system'),
            org_id=org_id,
            status='processing'
        )
        db.session.add(upload)
        db.session.commit()
        
        # Process document asynchronously
        try:
            # Get historical data for analysis
            historical_data = _get_historical_data(org_id, doc_type)
            
            # Process document
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(
                document_processor.process_single_document(
                    file_path,
                    doc_type,
                    {'historical_data': historical_data, 'org_id': org_id}
                )
            )
            
            if result['success']:
                # Store document record
                trade_doc = TradeDocument(
                    org_id=org_id,
                    document_type=result['document_type'],
                    document_number=result['extracted_data'].get('document_number', f"DOC-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"),
                    upload_id=upload.id,
                    extracted_data=result['extracted_data'],
                    extraction_confidence=result['metrics']['extraction_confidence'],
                    document_date=_parse_document_date(result['extracted_data']),
                    processed_at=datetime.utcnow(),
                    status='completed',
                    validation_errors=result['validation']['issues']
                )
                db.session.add(trade_doc)
                
                # Update upload status
                upload.status = 'completed'
                
                # Store processed data for analytics
                processed_data = ProcessedData(
                    upload_id=upload.id,
                    org_id=org_id,
                    data_type='trade_document',
                    processed_data=json.dumps({
                        'document_type': result['document_type'],
                        'extracted_data': result['extracted_data'],
                        'analytics': result['analytics'],
                        'metrics': result['metrics']
                    })
                )
                db.session.add(processed_data)
                
                # Update document analytics
                _update_document_analytics(org_id, result)
                
                db.session.commit()
                
                # Clean up temp file
                os.remove(file_path)
                os.rmdir(temp_dir)
                
                return jsonify({
                    'success': True,
                    'upload_id': upload.id,
                    'document_id': trade_doc.id,
                    'document_type': result['document_type'],
                    'summary': {
                        'confidence': result['metrics']['extraction_confidence'],
                        'processing_time': result['metrics']['processing_time'],
                        'anomalies': len(result['analytics']['anomalies']),
                        'risk_score': result['analytics']['risk_score']
                    },
                    'insights': result['analytics']['insights'][:3],  # Top 3 insights
                    'recommendations': result['analytics']['recommendations'][:3]  # Top 3 recommendations
                }), 200
                
            else:
                upload.status = 'error'
                upload.error_message = result.get('error', 'Processing failed')
                db.session.commit()
                
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'Document processing failed')
                }), 500
                
        except Exception as e:
            upload.status = 'error'
            upload.error_message = str(e)
            db.session.commit()
            
            current_app.logger.error(f"Document processing error: {str(e)}")
            return jsonify({'error': f'Processing failed: {str(e)}'}), 500
        
    except Exception as e:
        current_app.logger.error(f"Document upload error: {str(e)}")
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@documents_bp.route('/api/documents/batch', methods=['POST'])
def batch_upload_documents():
    """Process multiple documents in batch"""
    try:
        files = request.files.getlist('files')
        org_id = request.form.get('org_id')
        
        if not files:
            return jsonify({'error': 'No files provided'}), 400
        
        if not org_id:
            return jsonify({'error': 'Organization ID is required'}), 400
        
        # Prepare files for batch processing
        file_infos = []
        temp_paths = []
        
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                temp_dir = tempfile.mkdtemp()
                file_path = os.path.join(temp_dir, filename)
                file.save(file_path)
                
                file_infos.append({
                    'path': file_path,
                    'type': request.form.get(f'type_{file.filename}', 'auto'),
                    'metadata': {'org_id': org_id}
                })
                temp_paths.append((file_path, temp_dir))
        
        # Process batch
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        batch_result = loop.run_until_complete(
            document_processor.process_document_batch(file_infos)
        )
        
        # Clean up temp files
        for file_path, temp_dir in temp_paths:
            try:
                os.remove(file_path)
                os.rmdir(temp_dir)
            except:
                pass
        
        return jsonify({
            'success': True,
            'batch_summary': batch_result['summary'],
            'document_types': batch_result['document_types'],
            'metrics': batch_result['metrics'],
            'results': [
                {
                    'document_type': r['document_type'],
                    'success': r['success'],
                    'insights': r.get('analytics', {}).get('insights', [])[:2]
                } for r in batch_result['results']
            ]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Batch upload error: {str(e)}")
        return jsonify({'error': f'Batch processing failed: {str(e)}'}), 500

@documents_bp.route('/api/documents/<document_id>', methods=['GET'])
def get_document_details(document_id):
    """Get detailed information about a processed document"""
    try:
        doc = TradeDocument.query.filter_by(id=document_id).first()
        
        if not doc:
            return jsonify({'error': 'Document not found'}), 404
        
        # Get related data
        related_docs = _get_related_documents(doc)
        
        return jsonify({
            'document': {
                'id': doc.id,
                'type': doc.document_type,
                'number': doc.document_number,
                'date': doc.document_date.isoformat() if doc.document_date else None,
                'confidence': doc.extraction_confidence,
                'status': doc.status,
                'processed_at': doc.processed_at.isoformat() if doc.processed_at else None
            },
            'extracted_data': doc.extracted_data,
            'validation': {
                'errors': doc.validation_errors or [],
                'is_valid': len(doc.validation_errors or []) == 0
            },
            'related_documents': related_docs
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get document error: {str(e)}")
        return jsonify({'error': f'Failed to retrieve document: {str(e)}'}), 500

@documents_bp.route('/api/documents/analytics/<org_id>', methods=['GET'])
def get_document_analytics(org_id):
    """Get document intelligence analytics for organization"""
    try:
        # Get date range from query params
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        
        # Get document data
        query = TradeDocument.query.filter_by(org_id=org_id)
        
        if from_date:
            query = query.filter(TradeDocument.processed_at >= datetime.fromisoformat(from_date))
        if to_date:
            query = query.filter(TradeDocument.processed_at <= datetime.fromisoformat(to_date))
        
        documents = query.all()
        
        if not documents:
            return jsonify({
                'success': False,
                'message': 'No documents found for analysis'
            }), 404
        
        # Prepare data for analysis
        doc_data = []
        for doc in documents:
            doc_data.append({
                'document_type': doc.document_type,
                'extraction_confidence': doc.extraction_confidence,
                'is_digital': True,  # All uploaded docs are digital
                'has_tracking': doc.document_type == DocumentType.BILL_OF_LADING.value,
                'is_integrated': True,  # Via API
                'processing_time_seconds': 10,  # Placeholder
                'is_automated': doc.extraction_confidence > 0.8,
                'has_errors': len(doc.validation_errors or []) > 0,
                'required_manual_intervention': doc.extraction_confidence < 0.8,
                'passed_validation': len(doc.validation_errors or []) == 0,
                'document_completeness': 100 if not doc.validation_errors else 80
            })
        
        df = pd.DataFrame(doc_data)
        
        # Calculate document intelligence score
        doc_intelligence = intelligence_analytics.calculate_document_intelligence_score(df)
        
        # Get latest analytics record
        latest_analytics = DocumentAnalytics.query.filter_by(
            org_id=org_id
        ).order_by(DocumentAnalytics.period_date.desc()).first()
        
        # Document type distribution
        doc_type_dist = df['document_type'].value_counts().to_dict()
        
        # Processing metrics
        avg_confidence = df['extraction_confidence'].mean()
        automation_rate = (df['is_automated'].sum() / len(df)) * 100
        error_rate = (df['has_errors'].sum() / len(df)) * 100
        
        return jsonify({
            'document_intelligence': doc_intelligence,
            'metrics': {
                'total_documents': len(documents),
                'average_confidence': round(avg_confidence * 100, 1),
                'automation_rate': round(automation_rate, 1),
                'error_rate': round(error_rate, 1),
                'compliance_score': latest_analytics.compliance_score if latest_analytics else 0
            },
            'distribution': doc_type_dist,
            'trends': _calculate_document_trends(org_id),
            'recommendations': _generate_document_recommendations(doc_intelligence)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Document analytics error: {str(e)}")
        return jsonify({'error': f'Failed to generate analytics: {str(e)}'}), 500

@documents_bp.route('/api/documents/search', methods=['POST'])
def search_documents():
    """Search documents with filters"""
    try:
        filters = request.json or {}
        org_id = filters.get('org_id')
        
        if not org_id:
            return jsonify({'error': 'Organization ID is required'}), 400
        
        query = TradeDocument.query.filter_by(org_id=org_id)
        
        # Apply filters
        if 'document_type' in filters:
            query = query.filter_by(document_type=filters['document_type'])
        
        if 'document_number' in filters:
            query = query.filter(TradeDocument.document_number.contains(filters['document_number']))
        
        if 'from_date' in filters:
            query = query.filter(TradeDocument.document_date >= datetime.fromisoformat(filters['from_date']))
        
        if 'to_date' in filters:
            query = query.filter(TradeDocument.document_date <= datetime.fromisoformat(filters['to_date']))
        
        if 'min_confidence' in filters:
            query = query.filter(TradeDocument.extraction_confidence >= filters['min_confidence'])
        
        # Pagination
        page = filters.get('page', 1)
        per_page = filters.get('per_page', 50)
        
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        documents = []
        for doc in paginated.items:
            documents.append({
                'id': doc.id,
                'type': doc.document_type,
                'number': doc.document_number,
                'date': doc.document_date.isoformat() if doc.document_date else None,
                'confidence': doc.extraction_confidence,
                'has_errors': len(doc.validation_errors or []) > 0,
                'key_data': _extract_key_data(doc)
            })
        
        return jsonify({
            'documents': documents,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginated.total,
                'pages': paginated.pages
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Document search error: {str(e)}")
        return jsonify({'error': f'Search failed: {str(e)}'}), 500

@documents_bp.route('/api/documents/timeline/<org_id>', methods=['GET'])
def get_shipment_timeline(org_id):
    """Get shipment timeline view with all related documents"""
    try:
        # Get shipments with documents
        from models import ShipmentTracking
        
        shipments = ShipmentTracking.query.filter_by(org_id=org_id).order_by(
            ShipmentTracking.po_date.desc()
        ).limit(20).all()
        
        timeline = []
        for shipment in shipments:
            events = []
            
            # PO event
            if shipment.po_date:
                events.append({
                    'date': shipment.po_date.isoformat(),
                    'type': 'purchase_order',
                    'document_id': shipment.po_document_id,
                    'status': 'completed'
                })
            
            # Shipping event
            if shipment.ship_date:
                events.append({
                    'date': shipment.ship_date.isoformat(),
                    'type': 'bill_of_lading',
                    'document_id': shipment.bol_document_id,
                    'status': 'completed'
                })
            
            # Delivery event
            if shipment.actual_delivery_date:
                events.append({
                    'date': shipment.actual_delivery_date.isoformat(),
                    'type': 'delivery',
                    'status': 'completed'
                })
            elif shipment.eta_date:
                events.append({
                    'date': shipment.eta_date.isoformat(),
                    'type': 'delivery',
                    'status': 'pending'
                })
            
            timeline.append({
                'shipment_number': shipment.shipment_number,
                'current_status': shipment.current_status,
                'events': sorted(events, key=lambda x: x['date'])
            })
        
        return jsonify({
            'timeline': timeline,
            'summary': {
                'total_shipments': len(shipments),
                'in_transit': len([s for s in shipments if s.current_status == 'in_transit']),
                'delivered': len([s for s in shipments if s.current_status == 'delivered'])
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Timeline error: {str(e)}")
        return jsonify({'error': f'Failed to generate timeline: {str(e)}'}), 500

# Helper functions

def _get_historical_data(org_id: str, doc_type: str) -> List[Dict]:
    """Get historical document data for analysis"""
    # Get last 100 documents of same type
    historical = TradeDocument.query.filter_by(
        org_id=org_id,
        document_type=doc_type
    ).order_by(TradeDocument.processed_at.desc()).limit(100).all()
    
    return [doc.extracted_data for doc in historical if doc.extracted_data]

def _parse_document_date(extracted_data: Dict) -> Optional[datetime]:
    """Parse date from extracted data"""
    date_fields = ['document_date', 'invoice_date', 'order_date', 'ship_date', 'date']
    
    for field in date_fields:
        if field in extracted_data and extracted_data[field]:
            try:
                return datetime.fromisoformat(extracted_data[field])
            except:
                continue
    
    return None

def _update_document_analytics(org_id: str, result: Dict):
    """Update document analytics metrics"""
    today = datetime.utcnow().date()
    
    analytics = DocumentAnalytics.query.filter_by(
        org_id=org_id,
        period_date=today
    ).first()
    
    if not analytics:
        analytics = DocumentAnalytics(
            org_id=org_id,
            period_date=today
        )
        db.session.add(analytics)
    
    # Update metrics
    analytics.total_documents += 1
    analytics.digital_percentage = 100  # All API uploads are digital
    
    # Update efficiency metrics
    if result['metrics']['extraction_confidence'] > 0.8:
        analytics.automation_rate = (
            (analytics.automation_rate * (analytics.total_documents - 1) + 100) / 
            analytics.total_documents
        )
    
    if result['validation']['issues']:
        analytics.error_rate = (
            (analytics.error_rate * (analytics.total_documents - 1) + 100) / 
            analytics.total_documents
        )
    
    # Update compliance score
    if not result['validation']['issues']:
        analytics.compliance_score = min(100, analytics.compliance_score + 0.1)

def _get_related_documents(doc: TradeDocument) -> List[Dict]:
    """Find related documents (same PO, shipment, etc.)"""
    related = []
    
    if doc.extracted_data:
        # Look for PO number
        po_number = doc.extracted_data.get('po_number')
        if po_number:
            po_docs = TradeDocument.query.filter(
                TradeDocument.org_id == doc.org_id,
                TradeDocument.id != doc.id,
                TradeDocument.extracted_data.contains(po_number)
            ).limit(5).all()
            
            for related_doc in po_docs:
                related.append({
                    'id': related_doc.id,
                    'type': related_doc.document_type,
                    'date': related_doc.document_date.isoformat() if related_doc.document_date else None,
                    'relation': 'same_po'
                })
    
    return related

def _calculate_document_trends(org_id: str) -> Dict:
    """Calculate document processing trends"""
    # Get last 30 days of data
    from datetime import timedelta
    
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=30)
    
    analytics = DocumentAnalytics.query.filter(
        DocumentAnalytics.org_id == org_id,
        DocumentAnalytics.period_date >= start_date
    ).all()
    
    if not analytics:
        return {}
    
    df = pd.DataFrame([{
        'date': a.period_date.isoformat(),
        'compliance_score': a.compliance_score,
        'automation_rate': a.automation_rate,
        'error_rate': a.error_rate
    } for a in analytics])
    
    return {
        'compliance_trend': df['compliance_score'].tolist(),
        'automation_trend': df['automation_rate'].tolist(),
        'dates': df['date'].tolist()
    }

def _generate_document_recommendations(doc_intelligence: Dict) -> List[str]:
    """Generate recommendations based on document intelligence"""
    recommendations = []
    components = doc_intelligence['components']
    
    # Find weakest component
    weakest = min(components, key=components.get)
    
    if components[weakest] < 70:
        if weakest == 'compliance':
            recommendations.append("Implement automated compliance validation rules")
        elif weakest == 'visibility':
            recommendations.append("Increase OCR confidence with better document quality")
        elif weakest == 'efficiency':
            recommendations.append("Enable straight-through processing for common documents")
        elif weakest == 'accuracy':
            recommendations.append("Add data validation against master data")
    
    # General recommendations
    if doc_intelligence['document_intelligence_score'] > 80:
        recommendations.append("Consider implementing predictive document analytics")
    
    return recommendations[:3]

def _extract_key_data(doc: TradeDocument) -> Dict:
    """Extract key fields for display"""
    key_data = {}
    
    if doc.document_type == DocumentType.PURCHASE_ORDER.value:
        key_data = {
            'supplier': doc.extracted_data.get('supplier_name', 'N/A'),
            'amount': doc.extracted_data.get('total_amount', 0),
            'delivery_date': doc.extracted_data.get('delivery_date', 'N/A')
        }
    elif doc.document_type == DocumentType.COMMERCIAL_INVOICE.value:
        key_data = {
            'amount': doc.extracted_data.get('total_amount', 0),
            'due_date': doc.extracted_data.get('due_date', 'N/A'),
            'terms': doc.extracted_data.get('payment_terms', 'N/A')
        }
    elif doc.document_type == DocumentType.BILL_OF_LADING.value:
        key_data = {
            'carrier': doc.extracted_data.get('carrier_name', 'N/A'),
            'origin': doc.extracted_data.get('origin_port', 'N/A'),
            'destination': doc.extracted_data.get('destination_port', 'N/A')
        }
    
    return key_data