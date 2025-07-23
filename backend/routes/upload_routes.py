from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import pandas as pd
from datetime import datetime
import json
from models import db, Upload, ProcessedData
from supply_chain_engine import SupplyChainAnalyticsEngine
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

@upload_bp.route('/csv/validate', methods=['POST'])
@cross_origin()
def validate_csv():
    """Validate CSV data before processing - Enhanced from analytics dashboard"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        csv_type = request.form.get('csv_type', 'auto')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith('.csv'):
            return jsonify({'error': 'Only CSV files are supported for validation'}), 400
        
        # Read CSV
        df = pd.read_csv(file)
        
        # Auto-detect type if needed
        if csv_type == 'auto':
            csv_type = detect_csv_type(df)
        
        # Validate
        validation = validate_csv_data(df, csv_type)
        
        # Generate preview
        preview = df.head(10).to_dict(orient='records')
        
        return jsonify({
            'success': True,
            'csv_type': csv_type,
            'validation': validation,
            'preview': preview,
            'columns': list(df.columns),
            'row_count': len(df),
            'column_count': len(df.columns)
        })
        
    except Exception as e:
        logger.error(f"CSV validation error: {str(e)}")
        return jsonify({'error': f'Validation failed: {str(e)}'}), 500

@upload_bp.route('/csv/process', methods=['POST'])
@cross_origin()
def process_csv_analytics():
    """Process CSV files specifically for analytics dashboard integration"""
    try:
        org_id = request.form.get('org_id')
        user_id = request.form.get('user_id', 'csv_user')
        
        if not org_id:
            return jsonify({'error': 'Organization ID is required'}), 400
        
        # Handle inventory and sales files
        inventory_file = request.files.get('inventory_file')
        sales_file = request.files.get('sales_file')
        
        if not inventory_file and not sales_file:
            return jsonify({'error': 'At least one CSV file (inventory or sales) is required'}), 400
        
        # Process files
        combined_data = None
        
        if inventory_file and sales_file:
            # Process both files
            inventory_df = pd.read_csv(inventory_file)
            sales_df = pd.read_csv(sales_file)
            
            # Merge data for analytics (simplified)
            # This would be enhanced with proper data merging logic
            combined_data = inventory_df  # Placeholder
            
        elif inventory_file:
            # Process inventory only
            combined_data = pd.read_csv(inventory_file)
            
        elif sales_file:
            # Process sales only  
            combined_data = pd.read_csv(sales_file)
        
        # Normalize data for analytics engine
        normalized_data = normalize_csv_for_analytics(combined_data)
        
        # Process with Supply Chain Analytics Engine
        analytics_engine = SupplyChainAnalyticsEngine()
        analytics_result = analytics_engine.process_inventory_sales_csv(normalized_data)
        
        # Store results in database
        upload = Upload(
            filename=f"csv_analytics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            original_filename="csv_analytics_combined.csv",
            file_size=len(str(analytics_result)),
            file_type='csv_analytics',
            user_id=user_id,
            org_id=org_id,
            status='completed'
        )
        
        db.session.add(upload)
        db.session.flush()  # Get upload.id
        
        processed_data = ProcessedData(
            upload_id=upload.id,
            org_id=org_id,
            data_type='csv_analytics',
            processed_data=json.dumps(analytics_result)
        )
        
        db.session.add(processed_data)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'CSV files processed successfully',
            'upload_id': upload.id,
            'analytics': analytics_result,
            'org_id': org_id
        })
        
    except Exception as e:
        logger.error(f"CSV processing error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500

@upload_bp.route('/csv/analytics/<org_id>', methods=['GET'])
@cross_origin()
def get_csv_analytics(org_id):
    """Get processed CSV analytics data for dashboard consumption"""
    try:
        # Get latest processed data for organization
        processed_data = ProcessedData.query.filter_by(
            org_id=org_id,
            data_type='csv_analytics'
        ).order_by(ProcessedData.created_at.desc()).first()
        
        if not processed_data:
            return jsonify({
                'success': False,
                'error': 'No CSV analytics data found for this organization'
            }), 404
        
        # Parse and return analytics data
        analytics_data = json.loads(processed_data.processed_data)
        
        return jsonify({
            'success': True,
            'analytics': analytics_data,
            'org_id': org_id,
            'last_updated': processed_data.created_at.isoformat()
        })
        
    except Exception as e:
        logger.error(f"Analytics retrieval error: {str(e)}")
        return jsonify({'error': f'Failed to retrieve analytics: {str(e)}'}), 500

def normalize_csv_for_analytics(df):
    """Normalize CSV data to work with analytics engine"""
    # Create normalized DataFrame with expected columns
    normalized_df = df.copy()
    
    # Map common column variations to expected names
    column_mapping = {
        'k_sc_codigo_articulo': 'product_id',
        'sc_detalle_articulo': 'product_name', 
        'n_saldo_actual': 'current_stock',
        'n_costo_promedio': 'cost_per_unit',
        'sc_detalle_grupo': 'category',
        'n_cantidad': 'sales_quantity',
        'n_valor': 'sales_value'
    }
    
    # Rename columns
    for old_name, new_name in column_mapping.items():
        if old_name in normalized_df.columns:
            normalized_df = normalized_df.rename(columns={old_name: new_name})
    
    # Add missing required columns with defaults
    required_columns = {
        'product_id': 'UNKNOWN',
        'product_name': 'Unknown Product',
        'current_stock': 0,
        'cost_per_unit': 0,
        'selling_price': 0,
        'sales_quantity': 0,
        'sales_period': 30,
        'category': 'General'
    }
    
    for col, default_value in required_columns.items():
        if col not in normalized_df.columns:
            normalized_df[col] = default_value
    
    # Calculate selling_price if missing
    if 'selling_price' not in normalized_df.columns or normalized_df['selling_price'].isna().all():
        if 'sales_value' in normalized_df.columns and 'sales_quantity' in normalized_df.columns:
            # Calculate price from sales value and quantity
            mask = normalized_df['sales_quantity'] > 0
            normalized_df.loc[mask, 'selling_price'] = (
                normalized_df.loc[mask, 'sales_value'] / normalized_df.loc[mask, 'sales_quantity']
            )
            # Use cost_per_unit * 1.2 as fallback for missing prices
            mask_missing = normalized_df['selling_price'].isna()
            normalized_df.loc[mask_missing, 'selling_price'] = normalized_df.loc[mask_missing, 'cost_per_unit'] * 1.2
    
    return normalized_df