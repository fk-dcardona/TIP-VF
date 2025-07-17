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

upload_bp = Blueprint('upload', __name__)

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
            return jsonify({'error': 'Invalid file type. Only CSV and Excel files are allowed'}), 400
        
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
        
        # Process file with Supply Chain Engine
        try:
            if upload.file_type == 'csv':
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
                'sample_data': df.head(5).to_dict(orient='records')
            }
            upload.data_summary = json.dumps(summary)
            
            # Process with Supply Chain Analytics Engine
            try:
                engine = SupplyChainAnalyticsEngine()
                analytics = engine.process_inventory_sales_csv(df)
                
                # Store analytics results
                processed_data = ProcessedData(
                    upload_id=upload.id,
                    org_id=org_id,
                    data_type='supply_chain_analytics',
                    processed_data=json.dumps(analytics)
                )
                db.session.add(processed_data)
                
                # Initialize and run AI Agent
                executor = AgentExecutor(max_workers=3, default_timeout=120)
                executor.register_agent_class(AgentType.INVENTORY_MONITOR, InventoryMonitorAgent)
                
                # Create agent instance
                agent = executor.create_agent(
                    agent_id=f"inv_agent_{upload.id}",
                    agent_type=AgentType.INVENTORY_MONITOR,
                    name="Inventory Monitor",
                    description="Monitors inventory and generates recommendations",
                    config={}
                )
                
                # Run the agent with analytics as input
                agent_result = executor.execute_agent(
                    agent_id=agent.agent_id,
                    input_data={
                        "action": "analyze_inventory",
                        "analytics": analytics,
                        "summary": analytics.get('summary', {}),
                        "alerts": analytics.get('inventory_alerts', [])
                    },
                    org_id=org_id,
                    user_id=user_id
                )
                
                # Store agent results
                agent_data = ProcessedData(
                    upload_id=upload.id,
                    org_id=org_id,
                    data_type='agent_insights',
                    processed_data=json.dumps(agent_result.to_dict())
                )
                db.session.add(agent_data)
                
                upload.status = 'completed'
                db.session.commit()
                
                return jsonify({
                    'success': True,
                    'upload': upload.to_dict(),
                    'analytics': analytics,
                    'agent_result': agent_result.to_dict(),
                    'insights': {
                        'total_alerts': len(analytics.get('inventory_alerts', [])),
                        'critical_items': len([a for a in analytics.get('inventory_alerts', []) if a.get('alert_level') == 'critical']),
                        'key_recommendations': analytics.get('recommendations', [])[:3],
                        'agent_confidence': agent_result.confidence if hasattr(agent_result, 'confidence') else 0.85
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