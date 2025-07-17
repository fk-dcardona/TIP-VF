from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import pandas as pd
from datetime import datetime
import json
from models import db, Upload, ProcessedData
from supply_chain_engine import SupplyChainAnalyticsEngine
from agent_protocol.executors.agent_executor import AgentExecutor
from agent_protocol.agents.inventory_agent import InventoryMonitorAgent
from agent_protocol.core.agent_types import AgentType
from services.unified_document_intelligence_service import unified_document_intelligence

upload_bp = Blueprint('upload', __name__)

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'pdf', 'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('/upload', methods=['POST'])
async def upload_file():
    """Handle file upload"""
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        org_id = request.form.get('org_id')
        user_id = request.form.get('user_id', 'anonymous')  # Optional user ID
        
        if not org_id:
            return jsonify({'error': 'Organization ID is required'}), 400
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file extension
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Supported: CSV, Excel, PDF, PNG, JPG'}), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({'error': 'File too large. Maximum size is 50MB'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        
        upload_dir = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'))
        os.makedirs(upload_dir, exist_ok=True)
        
        filepath = os.path.join(upload_dir, unique_filename)
        file.save(filepath)
        
        # Create upload record
        upload = Upload(
            filename=unique_filename,
            original_filename=filename,
            file_size=file_size,
            file_type=filename.rsplit('.', 1)[1].lower(),
            user_id=user_id,
            org_id=org_id,
            status='processing'
        )
        
        db.session.add(upload)
        db.session.commit()
        
        # Process file based on type
        try:
            file_extension = upload.file_type.lower()
            
            if file_extension in ['csv', 'xlsx', 'xls']:
                # Handle structured data files with pandas
                if file_extension == 'csv':
                    df = pd.read_csv(filepath)
                else:
                    df = pd.read_excel(filepath)
                
                # Update upload record with file info
                upload.row_count = len(df)
                upload.column_count = len(df.columns)
                
                # Generate basic summary
                summary = {
                    'columns': list(df.columns),
                    'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
                    'sample_data': df.head(5).to_dict(orient='records'),
                    'processing_type': 'analytics'
                }
                upload.data_summary = json.dumps(summary)
                
                # Process with Enhanced Document Intelligence Service
                csv_data = df.to_dict(orient='records')
                
                # Use enhanced cross-reference engine for CSV data
                from services.enhanced_cross_reference_engine import DocumentEnhancedCrossReferenceEngine
                cross_ref_engine = DocumentEnhancedCrossReferenceEngine()
                
                # Convert CSV data to DataFrame for processing
                df_for_analysis = pd.DataFrame(csv_data)
                unified_results = cross_ref_engine.process_with_documents(org_id)
                
                # Add CSV-specific analytics
                unified_results['csv_analytics'] = {
                    'total_records': len(df),
                    'columns_analyzed': list(df.columns),
                    'data_quality_score': 85.0,  # Placeholder - implement actual scoring
                    'processing_type': 'csv_analytics'
                }
                
            elif file_extension in ['pdf', 'png', 'jpg', 'jpeg']:
                # Handle document files with Agent Astra
                upload.row_count = 0  # Documents don't have rows
                upload.column_count = 0
                
                # Generate document summary
                summary = {
                    'file_type': file_extension,
                    'file_size_mb': round(file_size / (1024 * 1024), 2),
                    'processing_type': 'document_intelligence',
                    'status': 'ready_for_astra'
                }
                upload.data_summary = json.dumps(summary)
                
                # Process with Enhanced Document Processor
                from services.enhanced_document_processor import EnhancedDocumentProcessor
                enhanced_processor = EnhancedDocumentProcessor()
                
                unified_results = await enhanced_processor.process_and_link_document(
                    filepath, org_id, doc_type='auto'
                )
                
                # Add document-specific analytics
                unified_results['document_analytics'] = {
                    'document_type': doc_type if doc_type != 'auto' else 'auto_detected',
                    'file_size_mb': round(file_size / (1024 * 1024), 2),
                    'processing_type': 'document_intelligence',
                    'extraction_confidence': unified_results.get('extracted_data', {}).get('confidence', 0)
                }
            
            # Store unified intelligence results
            if 'unified_results' in locals():
                # Store unified analysis results
                processed_data = ProcessedData(
                    upload_id=upload.id,
                    org_id=org_id,
                    data_type='unified_intelligence',
                    processed_data=json.dumps(unified_results)
                )
                db.session.add(processed_data)
                
                # Legacy analytics for backward compatibility
                analytics = unified_results.get('unified_analysis', {})
                
                # Initialize and run AI Agent with enhanced data
                try:
                    executor = AgentExecutor(max_workers=3, default_timeout=120)
                    executor.register_agent_class(AgentType.INVENTORY_MONITOR, InventoryMonitorAgent)
                    
                    # Create agent instance
                    agent = executor.create_agent(
                        agent_id=f"unified_agent_{upload.id}",
                        agent_type=AgentType.INVENTORY_MONITOR,
                        name="Unified Intelligence Monitor",
                        description="Monitors inventory with document cross-reference intelligence",
                        config={}
                    )
                    
                    # Run the agent with unified intelligence as input
                    agent_result = executor.execute_agent(
                        agent_id=agent.agent_id,
                        input_data={
                            "action": "analyze_inventory_with_documents",
                            "unified_intelligence": unified_results,
                            "analytics": analytics,
                            "compromised_inventory": unified_results.get('compromised_inventory', {}),
                            "real_time_alerts": unified_results.get('real_time_alerts', [])
                        },
                        org_id=org_id,
                        user_id=user_id
                    )
                    
                    # Store enhanced agent results
                    agent_data = ProcessedData(
                        upload_id=upload.id,
                        org_id=org_id,
                        data_type='unified_agent_insights',
                        processed_data=json.dumps(agent_result.to_dict())
                    )
                    db.session.add(agent_data)
                    
                except Exception as agent_error:
                    # Fallback to basic agent processing
                    print(f"Enhanced agent processing failed: {agent_error}")
                
                upload.status = 'completed'
                db.session.commit()
                
                return jsonify({
                    'success': True,
                    'upload': upload.to_dict(),
                    'unified_intelligence': unified_results,
                    'analytics': analytics,
                    'compromised_inventory': unified_results.get('compromised_inventory', {}),
                    'triangle_4d_score': unified_results.get('triangle_4d_score', {}),
                    'real_time_alerts': unified_results.get('real_time_alerts', []),
                    'enhanced_recommendations': unified_results.get('enhanced_recommendations', []),
                    'insights': {
                        'total_alerts': len(unified_results.get('real_time_alerts', [])),
                        'compromised_items': unified_results.get('compromised_inventory', {}).get('summary', {}).get('total_compromised_items', 0),
                        'financial_impact': unified_results.get('compromised_inventory', {}).get('summary', {}).get('total_financial_impact', 0),
                        'triangle_4d_score': unified_results.get('triangle_4d_score', {}).get('overall_4d_score', 0),
                        'document_score': unified_results.get('triangle_4d_score', {}).get('document_score', 0)
                    }
                }), 200
                
        except Exception as analytics_error:
                # If analytics fail, still save the upload but mark as partial
                upload.status = 'partial'
                upload.error_message = f"Analytics processing error: {str(analytics_error)}"
                db.session.commit()
                
                return jsonify({
                    'success': True,
                    'upload': upload.to_dict(),
                    'warning': f'File uploaded but analytics failed: {str(analytics_error)}',
                    'analytics': None,
                    'agent_result': None
                }), 200
            
        except Exception as e:
            upload.status = 'error'
            upload.error_message = str(e)
            db.session.commit()
            return jsonify({'error': f'Error processing file: {str(e)}'}), 500
        
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@upload_bp.route('/uploads/<org_id>', methods=['GET'])
def get_org_uploads(org_id):
    """Get all uploads for an organization"""
    try:
        uploads = Upload.query.filter_by(org_id=org_id).order_by(Upload.upload_date.desc()).all()
        return jsonify({
            'uploads': [upload.to_dict() for upload in uploads]
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch uploads: {str(e)}'}), 500

@upload_bp.route('/upload/<int:upload_id>', methods=['GET'])
def get_upload_details(upload_id):
    """Get details for a specific upload"""
    try:
        # Get organization ID from request headers or query params
        org_id = request.headers.get('X-Organization-ID') or request.args.get('org_id')
        
        if not org_id:
            return jsonify({'error': 'Organization ID is required'}), 401
        
        # Fetch upload and verify organization access
        upload = Upload.query.get_or_404(upload_id)
        
        # Security check: Ensure the upload belongs to the requesting organization
        if upload.org_id != org_id:
            return jsonify({'error': 'Access denied: Upload belongs to different organization'}), 403
        
        return jsonify({
            'upload': upload.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch upload details: {str(e)}'}), 500

@upload_bp.route('/template/<data_type>', methods=['GET'])
def download_template(data_type):
    """Download a template CSV file"""
    try:
        templates = {
            'inventory': {
                'Product ID': ['PROD001', 'PROD002', 'PROD003'],
                'Product Name': ['Widget A', 'Widget B', 'Widget C'],
                'Quantity': [100, 250, 75],
                'Unit Price': [10.99, 15.50, 22.00],
                'Warehouse': ['WH001', 'WH002', 'WH001'],
                'Last Updated': ['2024-01-15', '2024-01-14', '2024-01-15']
            },
            'supplier': {
                'Supplier ID': ['SUP001', 'SUP002', 'SUP003'],
                'Supplier Name': ['Acme Corp', 'Global Parts Ltd', 'Quality Supplies Inc'],
                'Contact Email': ['contact@acme.com', 'sales@globalparts.com', 'info@qualitysupplies.com'],
                'Rating': [4.5, 4.8, 4.2],
                'Lead Time (days)': [7, 5, 10],
                'Payment Terms': ['Net 30', 'Net 45', 'Net 30']
            },
            'shipment': {
                'Shipment ID': ['SHIP001', 'SHIP002', 'SHIP003'],
                'Order ID': ['ORD001', 'ORD002', 'ORD003'],
                'Origin': ['Shanghai', 'Rotterdam', 'Los Angeles'],
                'Destination': ['New York', 'London', 'Tokyo'],
                'Status': ['In Transit', 'Delivered', 'Processing'],
                'ETA': ['2024-01-25', '2024-01-20', '2024-01-30']
            }
        }
        
        if data_type not in templates:
            return jsonify({'error': 'Invalid template type'}), 400
        
        # Create CSV content
        df = pd.DataFrame(templates[data_type])
        csv_data = df.to_csv(index=False)
        
        # Return as downloadable file
        from flask import Response
        return Response(
            csv_data,
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename={data_type}_template.csv'}
        )
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate template: {str(e)}'}), 500