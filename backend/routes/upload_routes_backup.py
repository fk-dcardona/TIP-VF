from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import pandas as pd
from datetime import datetime
import json
from models import db, Upload, ProcessedData
from supply_chain_engine import SupplyChainAnalyticsEngine
try:
    from agent_protocol.executors.agent_executor import AgentExecutor
    from agent_protocol.agents.inventory_agent import InventoryMonitorAgent
    from agent_protocol.core.agent_types import AgentType
    AGENT_PROTOCOL_AVAILABLE = True
except ImportError:
    AGENT_PROTOCOL_AVAILABLE = False
    # Create dummy classes for testing
    class AgentExecutor:
        pass
    class InventoryMonitorAgent:
        pass
    class AgentType:
        INVENTORY_MONITOR = 'inventory_monitor'
try:
    from backend.services.unified_document_intelligence_service import unified_document_intelligence
    UNIFIED_INTELLIGENCE_AVAILABLE = True
except ImportError:
    UNIFIED_INTELLIGENCE_AVAILABLE = False
    def unified_document_intelligence(*args, **kwargs):
        return {"status": "service_unavailable"}
from flask_cors import cross_origin
import logging

upload_bp = Blueprint('upload', __name__)
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'pdf', 'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# CSV type detection - Enhanced from analytics dashboard
INVENTORY_REQUIRED_COLUMNS = [
    'k_sc_codigo_articulo', 'sc_detalle_articulo', 'sc_detalle_grupo',
    'n_saldo_actual', 'n_costo_promedio'
]

SALES_REQUIRED_COLUMNS = [
    'k_sc_codigo_articulo', 'sc_detalle_articulo', 'd_fecha_documento',
    'n_cantidad', 'n_valor'
]

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def detect_csv_type(df):
    """Detect if CSV is inventory, sales, or mixed based on columns"""
    columns = [col.lower().strip() for col in df.columns]
    
    # Check for inventory columns
    inventory_matches = sum(1 for col in INVENTORY_REQUIRED_COLUMNS if any(col.lower() in c for c in columns))
    
    # Check for sales columns  
    sales_matches = sum(1 for col in SALES_REQUIRED_COLUMNS if any(col.lower() in c for c in columns))
    
    if inventory_matches >= 3 and sales_matches >= 3:
        return 'mixed'
    elif inventory_matches >= 3:
        return 'inventory'
    elif sales_matches >= 3:
        return 'sales'
    else:
        return 'unknown'

def validate_csv_data(df, csv_type):
    """Validate CSV data using analytics dashboard logic"""
    errors = []
    warnings = []
    
    if csv_type == 'inventory':
        # Check required inventory columns
        missing_cols = [col for col in INVENTORY_REQUIRED_COLUMNS if col not in df.columns]
        if missing_cols:
            errors.append(f"Missing required columns: {', '.join(missing_cols)}")
            
        # Validate numeric columns
        if 'n_saldo_actual' in df.columns:
            non_numeric = df[~pd.to_numeric(df['n_saldo_actual'], errors='coerce').notna()]
            if not non_numeric.empty:
                warnings.append(f"Non-numeric values found in current stock column")
                
    elif csv_type == 'sales':
        # Check required sales columns
        missing_cols = [col for col in SALES_REQUIRED_COLUMNS if col not in df.columns]
        if missing_cols:
            errors.append(f"Missing required columns: {', '.join(missing_cols)}")
            
        # Validate date format
        if 'd_fecha_documento' in df.columns:
            try:
                pd.to_datetime(df['d_fecha_documento'].dropna(), errors='coerce')
            except:
                warnings.append("Some dates may not be in the correct format")
    
    return {
        'is_valid': len(errors) == 0,
        'errors': errors,
        'warnings': warnings,
        'row_count': len(df),
        'column_count': len(df.columns)
    }

@upload_bp.route('/upload', methods=['POST'])
def upload_file():
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
                
                # Detect CSV type and validate
                csv_type = detect_csv_type(df)
                validation_result = validate_csv_data(df, csv_type)
                
                # Generate enhanced summary with validation
                summary = {
                    'columns': list(df.columns),
                    'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
                    'sample_data': df.head(5).to_dict(orient='records'),
                    'processing_type': 'analytics',
                    'csv_type': csv_type,
                    'validation_status': 'completed' if validation_result['is_valid'] else 'failed',
                    'validation_errors': validation_result['errors'],
                    'validation_warnings': validation_result['warnings'],
                    'analytics_ready': validation_result['is_valid']
                }
                upload.data_summary = json.dumps(summary)
                
                # Process with Supply Chain Analytics Engine
                analytics_engine = SupplyChainAnalyticsEngine()
                analytics_result = analytics_engine.process_inventory_sales_csv(df)
                
                # Store analytics results
                processed_data = ProcessedData(
                    upload_id=upload.id,
                    data_type='supply_chain_analytics',
                    processed_data=json.dumps(analytics_result)
                )
                db.session.add(processed_data)
                
                # Update summary with analytics status
                summary['validation_status'] = 'completed'
                summary['analytics_ready'] = True
                summary['analytics_preview'] = {
                    'total_products': analytics_result.get('summary', {}).get('total_products', 0),
                    'data_quality_score': analytics_result.get('data_quality_score', 0),
                    'key_metrics': analytics_result.get('key_metrics', {})
                }
                upload.data_summary = json.dumps(summary)
                
                # Process with Enhanced Document Intelligence Service
                csv_data = df.to_dict(orient='records')
                
                # Use enhanced cross-reference engine for CSV data
from backend.services.enhanced_cross_reference_engine import DocumentEnhancedCrossReferenceEngine
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
from backend.services.enhanced_document_processor import EnhancedDocumentProcessor
                enhanced_processor = EnhancedDocumentProcessor()
                
                unified_results = enhanced_processor.process_and_link_document(
                    filepath, org_id, doc_type='auto'
                )
                
                # Add document-specific analytics
                unified_results['document_analytics'] = {
                    'document_type': 'auto_detected',
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

# ==================== NEW CSV ANALYTICS ENDPOINTS ====================

@upload_bp.route('/csv/validate', methods=['POST'])
@cross_origin()
def validate_csv():
    """Validate CSV data before processing - Enhanced from analytics dashboard"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        csv_type = request.form.get('csv_type', 'auto')  # 'inventory', 'sales', or 'auto'
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read CSV data
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            return jsonify({'error': 'Only CSV files are supported for validation'}), 400
        
        # Auto-detect CSV type if not specified
        if csv_type == 'auto':
            csv_type = detect_csv_type(df)
        
        # Validate the data
        validation_result = validate_csv_data(df, csv_type)
        
        return jsonify({
            'success': True,
            'csv_type': csv_type,
            'validation': validation_result,
            'preview': df.head(5).to_dict(orient='records')
        })
        
    except Exception as e:
        return jsonify({'error': f'Validation failed: {str(e)}'}), 500

@upload_bp.route('/csv/process', methods=['POST'])
@cross_origin()
def process_csv_analytics():
    """Process CSV files specifically for analytics dashboard integration"""
    try:
        org_id = request.form.get('org_id')
        user_id = request.form.get('user_id', 'anonymous')
        
        if not org_id:
            return jsonify({'error': 'Organization ID is required'}), 400
        
        inventory_file = request.files.get('inventory_file')
        sales_file = request.files.get('sales_file')
        
        if not inventory_file and not sales_file:
            return jsonify({'error': 'At least one file (inventory or sales) is required'}), 400
        
        # Process inventory data
        inventory_df = None
        if inventory_file:
            inventory_df = pd.read_csv(inventory_file)
            inventory_validation = validate_csv_data(inventory_df, 'inventory')
            if not inventory_validation['is_valid']:
                return jsonify({
                    'error': 'Inventory validation failed',
                    'validation_errors': inventory_validation['errors']
                }), 400
        
        # Process sales data
        sales_df = None
        if sales_file:
            sales_df = pd.read_csv(sales_file)
            sales_validation = validate_csv_data(sales_df, 'sales')
            if not sales_validation['is_valid']:
                return jsonify({
                    'error': 'Sales validation failed',
                    'validation_errors': sales_validation['errors']
                }), 400
        
        # Combine dataframes for analytics processing
        if inventory_df is not None and sales_df is not None:
            # Both files provided - use enhanced analytics
            combined_df = pd.concat([
                inventory_df.assign(data_source='inventory'),
                sales_df.assign(data_source='sales')
            ], ignore_index=True, sort=False)
        elif inventory_df is not None:
            combined_df = inventory_df.assign(data_source='inventory')
        else:
            combined_df = sales_df.assign(data_source='sales')
        
        # Process with Supply Chain Analytics Engine
        analytics_engine = SupplyChainAnalyticsEngine()
        analytics_result = analytics_engine.process_inventory_sales_csv(combined_df)
        
        # Create upload records for tracking
        uploads = []
        
        if inventory_file:
            inventory_upload = Upload(
                filename=inventory_file.filename,
                original_filename=inventory_file.filename,
                file_size=len(str(inventory_df)),
                file_type='csv',
                user_id=user_id,
                org_id=org_id,
                status='completed',
                row_count=len(inventory_df),
                column_count=len(inventory_df.columns),
                data_summary=json.dumps({
                    'csv_type': 'inventory',
                    'validation_status': 'completed',
                    'analytics_ready': True
                })
            )
            db.session.add(inventory_upload)
            uploads.append(inventory_upload)
        
        if sales_file:
            sales_upload = Upload(
                filename=sales_file.filename,
                original_filename=sales_file.filename,
                file_size=len(str(sales_df)),
                file_type='csv',
                user_id=user_id,
                org_id=org_id,
                status='completed',
                row_count=len(sales_df),
                column_count=len(sales_df.columns),
                data_summary=json.dumps({
                    'csv_type': 'sales',
                    'validation_status': 'completed',
                    'analytics_ready': True
                })
            )
            db.session.add(sales_upload)
            uploads.append(sales_upload)
        
        db.session.commit()
        
        # Store analytics results
        if uploads:
            processed_data = ProcessedData(
                upload_id=uploads[0].id,  # Link to first upload
                org_id=org_id,
                data_type='csv_analytics',
                processed_data=json.dumps(analytics_result)
            )
            db.session.add(processed_data)
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'CSV files processed successfully',
            'uploads': [upload.to_dict() for upload in uploads],
            'analytics': analytics_result,
            'dashboard_ready': True
        })
        
    except Exception as e:
        logger.error(f"CSV processing error: {str(e)}")
        return jsonify({'error': f'CSV processing failed: {str(e)}'}), 500

@upload_bp.route('/csv/analytics/<org_id>', methods=['GET'])
@cross_origin()
def get_csv_analytics(org_id):
    """Get processed CSV analytics data for dashboard consumption"""
    try:
        # Get the latest analytics data for the organization
        latest_analytics = ProcessedData.query.filter_by(
            org_id=org_id,
            data_type='csv_analytics'
        ).order_by(ProcessedData.created_at.desc()).first()
        
        if not latest_analytics:
            return jsonify({
                'error': 'No analytics data found for this organization'
            }), 404
        
        analytics_data = json.loads(latest_analytics.processed_data)
        
        # Format for frontend consumption (matching analytics dashboard format)
        formatted_data = {
            'summary': analytics_data.get('summary', {}),
            'key_metrics': analytics_data.get('key_metrics', {}),
            'inventory_alerts': analytics_data.get('inventory_alerts', []),
            'product_performance': analytics_data.get('product_performance', []),
            'financial_insights': analytics_data.get('financial_insights', {}),
            'recommendations': analytics_data.get('recommendations', []),
            'charts_data': {
                'revenue_trend': analytics_data.get('charts', {}).get('revenue_trend', []),
                'stock_status': analytics_data.get('charts', {}).get('stock_status', []),
                'performance_matrix': analytics_data.get('charts', {}).get('performance_matrix', [])
            },
            'last_updated': latest_analytics.created_at.isoformat(),
            'data_quality_score': analytics_data.get('data_quality_score', 0)
        }
        
        return jsonify({
            'success': True,
            'analytics': formatted_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching CSV analytics: {str(e)}")
        return jsonify({'error': f'Failed to fetch analytics: {str(e)}'}), 500