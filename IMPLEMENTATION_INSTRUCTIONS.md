# 🚀 Multi-CSV Intelligence System - Implementation Instructions

## Quick Start: Transform Your System in 4 Steps

### **Step 1: Add Unified Transaction Model (15 minutes)**

Add to `models.py`:

```python
class UnifiedTransaction(db.Model):
    __tablename__ = 'unified_transactions'
    
    transaction_id = db.Column(db.String(50), primary_key=True)
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    transaction_type = db.Column(db.String(20))  # SALE, PURCHASE, INVENTORY
    transaction_date = db.Column(db.Date)
    
    # Product fields
    sku = db.Column(db.String(100))
    product_description = db.Column(db.String(500))
    product_category = db.Column(db.String(100))
    brand = db.Column(db.String(100))
    
    # Financial fields  
    quantity = db.Column(db.Float)
    unit_cost = db.Column(db.Float)
    total_cost = db.Column(db.Float)
    currency = db.Column(db.String(3), default='USD')
    
    # Supply chain fields
    supplier_name = db.Column(db.String(255))
    customer_name = db.Column(db.String(255))
    city = db.Column(db.String(100))
    country = db.Column(db.String(100))
    
    # Inventory fields
    available_stock = db.Column(db.Float)
    in_transit_stock = db.Column(db.Float)
    
    # Metadata
    upload_id = db.Column(db.Integer, db.ForeignKey('uploads.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    organization = db.relationship('Organization', backref='unified_transactions')
```

### **Step 2: Create Migration and Update Database (5 minutes)**

```bash
# Create the table
python -c "
from models import db, UnifiedTransaction
from main import app
with app.app_context():
    db.create_all()
    print('UnifiedTransaction table created successfully')
"
```

### **Step 3: Update Upload Route for Multi-CSV Processing (20 minutes)**

Replace the analytics processing section in `routes/upload_routes.py`:

```python
# Add this import at the top
from services.unified_supply_chain_engine import UnifiedSupplyChainEngine
from services.unified_transformer_service import UnifiedTransformerService

# Replace the analytics processing section (around line 96-159) with:
try:
    # Auto-detect format and transform to unified model
    transformer_service = UnifiedTransformerService()
    
    # Check if already in unified format or needs transformation
    if 'transaction_type' in df.columns:
        # Already unified format
        unified_df = df
    else:
        # Transform from ERP format to unified
        unified_df = transformer_service.transform_to_unified(df, filepath)
    
    # Process with unified engine
    unified_engine = UnifiedSupplyChainEngine()
    results = unified_engine.process_unified_transactions(unified_df, org_id)
    
    # Store unified transactions in database
    for _, row in unified_df.iterrows():
        transaction = UnifiedTransaction()
        transaction.transaction_id = row.get('transaction_id', f"TXN-{upload.id}-{len(unified_df)}")
        transaction.org_id = org_id
        transaction.upload_id = upload.id
        
        # Map all fields
        for field in ['transaction_type', 'transaction_date', 'sku', 'product_description', 
                     'quantity', 'unit_cost', 'total_cost', 'supplier_name', 'customer_name',
                     'city', 'country', 'available_stock', 'brand', 'product_category']:
            if field in row and pd.notna(row[field]):
                setattr(transaction, field, row[field])
        
        db.session.add(transaction)
    
    # Store results
    processed_data = ProcessedData(
        upload_id=upload.id,
        org_id=org_id,
        data_type='unified_intelligence',
        processed_data=json.dumps(results)
    )
    db.session.add(processed_data)
    
    # Run AI Agent with enhanced data
    agent_result = executor.execute_agent(
        agent_id=agent.agent_id,
        input_data={
            "action": "analyze_unified_data",
            "unified_results": results,
            "viral_opportunities": results.get('viral_opportunities', {}),
            "supplier_scorecards": results.get('viral_opportunities', {}).get('supplier_scorecards', [])
        },
        org_id=org_id,
        user_id=user_id
    )
    
    upload.status = 'completed'
    db.session.commit()
    
    return jsonify({
        'success': True,
        'upload': upload.to_dict(),
        'unified_intelligence': results,
        'agent_result': agent_result.to_dict(),
        'viral_opportunities': results.get('viral_opportunities', {}),
        'executive_summary': results.get('executive_summary', {}),
        'supplier_scorecards': results.get('viral_opportunities', {}).get('supplier_scorecards', [])
    }), 200

except Exception as analytics_error:
    # Fallback to original engine if unified processing fails
    engine = SupplyChainAnalyticsEngine()
    analytics = engine.process_inventory_sales_csv(df)
    # ... rest of existing error handling
```

### **Step 4: Create Unified Transformer Service (25 minutes)**

Create `services/unified_transformer_service.py`:

```python
import pandas as pd
import numpy as np
from datetime import datetime
import re
from typing import Dict, List, Optional

class UnifiedTransformerService:
    """Transform various ERP formats into unified transaction model"""
    
    def __init__(self):
        self.transaction_counter = 0
    
    def transform_to_unified(self, df: pd.DataFrame, source_file: str) -> pd.DataFrame:
        """Auto-detect format and transform to unified model"""
        
        # Detect format based on columns
        format_type = self._detect_format(df.columns.tolist())
        
        if format_type == 'customer1_sales':
            return self._transform_customer1_sales(df)
        elif format_type == 'customer1_inventory':
            return self._transform_customer1_inventory(df)
        elif format_type == 'helti_sales':
            return self._transform_helti_sales(df)
        elif format_type == 'helti_inventory':
            return self._transform_helti_inventory(df)
        else:
            return self._transform_generic(df)
    
    def _detect_format(self, columns: List[str]) -> str:
        """Detect ERP format based on column names"""
        
        clean_cols = [col.lower().strip() for col in columns]
        
        # Customer 1 patterns (your example)
        if 'k_sc_codigo_fuente' in clean_cols or 'n_numero_documento' in clean_cols:
            if 'cantidad' in clean_cols and 'valor' in clean_cols:
                return 'customer1_sales'
        
        if 'k_sc_codigo_articulo' in clean_cols and 'n_saldo_actual' in clean_cols:
            return 'customer1_inventory'
        
        # Helti patterns  
        if 'referencia' in clean_cols and 'desc. ciudad' in clean_cols:
            return 'helti_sales'
        
        if 'bodega' in clean_cols and 'categoria principal' in clean_cols:
            return 'helti_inventory'
        
        return 'generic'
    
    def _transform_customer1_sales(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform Customer 1 sales format"""
        
        unified_data = []
        
        for _, row in df.iterrows():
            unified_row = {
                'transaction_id': self._generate_transaction_id('SALE'),
                'transaction_type': 'SALE',
                'transaction_date': self._parse_date(row.get('d_fecha_documento')),
                'sku': self._clean_text(row.get('k_sc_codigo_articulo')),
                'product_description': self._clean_text(row.get('sc_detalle_articulo')),
                'product_category': self._clean_text(row.get('sc_detalle_grupo')),
                'brand': self._clean_text(row.get('MARCA')),
                'quantity': self._clean_number(row.get('CANTIDAD')),
                'unit_cost': None,  # Not available in sales data
                'total_cost': self._clean_currency(row.get('V_NETA')),
                'currency': 'COP',
                'customer_name': self._clean_text(row.get('sc_nombre')),
                'city': self._clean_text(row.get('CIUDAD')),
                'country': 'CO',
                'supplier_name': None,
                'available_stock': None,
                'in_transit_stock': None
            }
            
            # Calculate unit cost if possible
            if unified_row['quantity'] and unified_row['total_cost']:
                unified_row['unit_cost'] = unified_row['total_cost'] / unified_row['quantity']
            
            unified_data.append(unified_row)
        
        return pd.DataFrame(unified_data)
    
    def _transform_customer1_inventory(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform Customer 1 inventory format"""
        
        unified_data = []
        
        for _, row in df.iterrows():
            unified_row = {
                'transaction_id': self._generate_transaction_id('INV'),
                'transaction_type': 'INVENTORY',
                'transaction_date': datetime.now().strftime('%Y-%m-%d'),
                'sku': self._clean_text(row.get('k_sc_codigo_articulo')),
                'product_description': self._clean_text(row.get('sc_detalle_articulo')),
                'product_category': self._clean_text(row.get('sc_detalle_grupo')),
                'product_subcategory': self._clean_text(row.get('sc_detalle_subgrupo')),
                'brand': None,
                'quantity': self._clean_number(row.get('n_saldo_actual')),
                'unit_cost': self._clean_currency(row.get('n_costo_promedio')),
                'total_cost': None,  # Will calculate
                'currency': 'COP',
                'customer_name': None,
                'city': None,
                'country': 'CO',
                'supplier_name': None,
                'available_stock': self._clean_number(row.get('n_saldo_actual')),
                'in_transit_stock': self._clean_number(row.get('n_entradas'))
            }
            
            # Calculate total cost
            if unified_row['quantity'] and unified_row['unit_cost']:
                unified_row['total_cost'] = unified_row['quantity'] * unified_row['unit_cost']
            
            unified_data.append(unified_row)
        
        return pd.DataFrame(unified_data)
    
    def _transform_helti_sales(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform Helti sales format"""
        
        unified_data = []
        
        for _, row in df.iterrows():
            unified_row = {
                'transaction_id': self._generate_transaction_id('SALE'),
                'transaction_type': 'SALE', 
                'transaction_date': self._parse_date(row.get('Fecha Cierre')),
                'sku': self._clean_text(row.get('Referencia')),
                'product_description': self._clean_text(row.get('Desc. item')),
                'brand': self._clean_text(row.get('MARCA')),
                'quantity': self._clean_number(row.get('Cantidad inv.')),
                'total_cost': self._clean_currency(row.get('Valor neto local')),
                'currency': 'COP',
                'city': self._clean_text(row.get('Desc. ciudad')),
                'country': 'CO'
            }
            
            if unified_row['quantity'] and unified_row['total_cost']:
                unified_row['unit_cost'] = unified_row['total_cost'] / unified_row['quantity']
            
            unified_data.append(unified_row)
        
        return pd.DataFrame(unified_data)
    
    def _transform_helti_inventory(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform Helti inventory format"""
        
        unified_data = []
        
        for _, row in df.iterrows():
            unified_row = {
                'transaction_id': self._generate_transaction_id('INV'),
                'transaction_type': 'INVENTORY',
                'transaction_date': datetime.now().strftime('%Y-%m-%d'),
                'sku': self._clean_text(row.get('Referencia')),
                'product_description': self._clean_text(row.get('Desc. item')),
                'product_category': self._clean_text(row.get('CATEGORIA PRINCIPAL')),
                'product_subcategory': self._clean_text(row.get('TIPO DE PRODUCTO')),
                'brand': self._clean_text(row.get('MARCA')),
                'quantity': self._clean_number(row.get('Cant. disponible')),
                'unit_cost': self._clean_currency(row.get('Costo prom. uni.')),
                'currency': 'COP',
                'country': 'CO',
                'available_stock': self._clean_number(row.get('Cant. disponible')),
                'in_transit_stock': self._clean_number(row.get('Cant. transito ent.'))
            }
            
            if unified_row['quantity'] and unified_row['unit_cost']:
                unified_row['total_cost'] = unified_row['quantity'] * unified_row['unit_cost']
            
            unified_data.append(unified_row)
        
        return pd.DataFrame(unified_data)
    
    def _transform_generic(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform generic CSV format using intelligent column mapping"""
        
        # Map common column patterns
        column_map = {
            'transaction_type': ['type', 'transaction_type', 'doc_type'],
            'sku': ['sku', 'product_id', 'item_code', 'codigo', 'referencia'],
            'product_description': ['description', 'desc', 'producto', 'item'],
            'quantity': ['quantity', 'qty', 'cantidad', 'units'],
            'unit_cost': ['cost', 'price', 'costo', 'precio'],
            'supplier_name': ['supplier', 'vendor', 'proveedor'],
            'customer_name': ['customer', 'cliente', 'client']
        }
        
        unified_data = []
        
        for _, row in df.iterrows():
            unified_row = {
                'transaction_id': self._generate_transaction_id('GEN'),
                'transaction_type': 'INVENTORY',  # Default
                'transaction_date': datetime.now().strftime('%Y-%m-%d'),
                'currency': 'USD'
            }
            
            # Map columns intelligently
            for unified_field, possible_cols in column_map.items():
                for col in possible_cols:
                    if col in df.columns or col.lower() in [c.lower() for c in df.columns]:
                        actual_col = next(c for c in df.columns if c.lower() == col.lower())
                        unified_row[unified_field] = self._clean_value(row.get(actual_col))
                        break
            
            unified_data.append(unified_row)
        
        return pd.DataFrame(unified_data)
    
    # Helper methods
    
    def _generate_transaction_id(self, prefix: str) -> str:
        """Generate unique transaction ID"""
        self.transaction_counter += 1
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return f"{prefix}-{timestamp}-{self.transaction_counter:06d}"
    
    def _parse_date(self, date_str) -> Optional[str]:
        """Parse date from various formats"""
        if pd.isna(date_str) or date_str == '':
            return None
        
        try:
            # Try common formats
            for fmt in ['%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d', '%d/%m/%y']:
                try:
                    date_obj = datetime.strptime(str(date_str).strip(), fmt)
                    return date_obj.strftime('%Y-%m-%d')
                except ValueError:
                    continue
        except:
            pass
        
        return None
    
    def _clean_text(self, value) -> Optional[str]:
        """Clean text field"""
        if pd.isna(value) or value == '':
            return None
        return str(value).strip()
    
    def _clean_number(self, value) -> Optional[float]:
        """Clean numeric field"""
        if pd.isna(value) or value == '':
            return None
        
        try:
            # Handle comma decimal separator
            if isinstance(value, str):
                value = value.replace(',', '.')
            return float(value)
        except:
            return None
    
    def _clean_currency(self, value) -> Optional[float]:
        """Clean currency field"""
        if pd.isna(value) or value == '':
            return None
        
        try:
            # Remove currency symbols and separators
            cleaned = re.sub(r'[$€£¥₹₱]', '', str(value))
            cleaned = re.sub(r'[,\s]', '', cleaned)
            cleaned = cleaned.replace('.', '').replace(',', '.')
            
            # Handle Colombian format (1.234.567,89)
            if ',' in cleaned:
                parts = cleaned.split(',')
                if len(parts) == 2 and len(parts[1]) == 2:
                    cleaned = parts[0].replace('.', '') + '.' + parts[1]
            
            return float(cleaned)
        except:
            return None
    
    def _clean_value(self, value):
        """Clean any value intelligently"""
        if pd.isna(value):
            return None
        
        # Try number first
        number_result = self._clean_number(value)
        if number_result is not None:
            return number_result
        
        # Otherwise return as text
        return self._clean_text(value)
```

## 🎯 Testing Your Implementation

### **Test with Sample Data**

Create `test_multi_csv.py`:

```python
import pandas as pd
from services.unified_transformer_service import UnifiedTransformerService
from services.unified_supply_chain_engine import UnifiedSupplyChainEngine

# Test Customer 1 data
customer1_sales = pd.DataFrame([
    {
        'k_sc_codigo_fuente': 'FE',
        'n_numero_documento': '12182',
        'd_fecha_documento': '2/1/25',
        'sc_nombre': 'ALBERTO CORREA MORA',
        'k_sc_codigo_articulo': 'ANEBMF0300',
        'sc_detalle_articulo': 'ENJUAGUE BUCAL ACTIVMINT MENTA FRESCA X 300ML',
        'CANTIDAD': '2',
        'VALOR': '46005',
        'V_NETA': '92010',
        'MARCA': 'PC- PERSONAL CARE',
        'CIUDAD': 'RIONEGRO'
    }
])

# Transform and process
transformer = UnifiedTransformerService()
unified_df = transformer.transform_to_unified(customer1_sales, 'test.csv')

engine = UnifiedSupplyChainEngine()
results = engine.process_unified_transactions(unified_df, 'test_org')

print("🎉 Results:", results.keys())
print("📊 Supplier Scorecards:", len(results.get('viral_opportunities', {}).get('supplier_scorecards', [])))
```

### **Expected Results**

After implementation, you'll get:

1. **Multi-format support** - Automatic detection and transformation
2. **Cross-referenced intelligence** - Insights across sales, inventory, purchases
3. **Supplier scorecards** - Shareable performance reports
4. **Viral growth opportunities** - Inventory financing, benchmarks
5. **Executive summaries** - High-level insights for decision makers

## 🚀 Go Live Strategy

1. **Week 1**: Implement unified model and basic transformation
2. **Week 2**: Test with real customer data, refine algorithms  
3. **Week 3**: Launch supplier scorecard sharing feature
4. **Week 4**: Enable market intelligence subscriptions

**This implementation turns your single-CSV system into a multi-source intelligence platform that creates viral growth loops!** 🚀