"""
Trade Document Processing Engine with Agent Astra Integration
Handles extraction and analysis of trade finance documents
"""

import aiohttp
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json
import pandas as pd
import numpy as np
from dataclasses import dataclass
from enum import Enum
from backend.config.settings import settings

class DocumentType(Enum):
    PURCHASE_ORDER = "purchase_order"
    COMMERCIAL_INVOICE = "commercial_invoice"
    BILL_OF_LADING = "bill_of_lading"
    PACKING_LIST = "packing_list"
    LETTER_OF_CREDIT = "letter_of_credit"
    CERTIFICATE_ORIGIN = "certificate_of_origin"
    INSURANCE_CERTIFICATE = "insurance_certificate"
    CUSTOMS_DECLARATION = "customs_declaration"

@dataclass
class DocumentMetrics:
    processing_time: float
    extraction_confidence: float
    compliance_issues: List[str]
    data_completeness: float
    anomalies_detected: List[str]

class TradeDocumentProcessor:
    """Main document processing engine with Agent Astra integration"""
    
    def __init__(self):
        self.api_key = settings.AGENT_ASTRA_API_KEY
        self.base_url = settings.AGENT_ASTRA_BASE_URL
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        # Document templates for extraction
        self.extraction_templates = self._load_extraction_templates()
        
        # Validation rules
        self.validation_rules = self._load_validation_rules()
    
    async def process_document_batch(self, files: List[Dict]) -> Dict:
        """Process multiple documents in batch"""
        tasks = []
        for file_info in files:
            task = self.process_single_document(
                file_info['path'],
                file_info.get('type', 'auto'),
                file_info.get('metadata', {})
            )
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Aggregate results
        return self._aggregate_batch_results(results)
    
    async def process_single_document(self, file_path: str, doc_type: str = 'auto', metadata: Dict = {}) -> Dict:
        """Process a single document through the complete pipeline"""
        start_time = datetime.utcnow()
        
        try:
            # 1. Upload document
            upload_result = await self._upload_document(file_path)
            document_id = upload_result['document_id']
            
            # 2. Classify if needed
            if doc_type == 'auto':
                doc_type = await self._classify_document(document_id)
            
            # 3. Extract structured data
            extraction_result = await self._extract_document_data(document_id, doc_type)
            
            # 4. Validate extracted data
            validation_result = self._validate_extraction(extraction_result, doc_type)
            
            # 5. Enrich with analytics
            analytics_result = self._analyze_document(extraction_result, doc_type, metadata)
            
            # 6. Calculate metrics
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            metrics = DocumentMetrics(
                processing_time=processing_time,
                extraction_confidence=extraction_result.get('confidence', 0),
                compliance_issues=validation_result['issues'],
                data_completeness=validation_result['completeness'],
                anomalies_detected=analytics_result['anomalies']
            )
            
            return {
                'success': True,
                'document_id': document_id,
                'document_type': doc_type,
                'extracted_data': extraction_result['data'],
                'validation': validation_result,
                'analytics': analytics_result,
                'metrics': metrics.__dict__,
                'processed_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'document_type': doc_type,
                'processed_at': datetime.utcnow().isoformat()
            }
    
    async def _upload_document(self, file_path: str) -> Dict:
        """Upload document to Agent Astra"""
        async with aiohttp.ClientSession() as session:
            with open(file_path, 'rb') as f:
                data = aiohttp.FormData()
                data.add_field('file', f, filename=file_path.split('/')[-1])
                
                async with session.post(
                    f'{self.base_url}/documents/upload',
                    headers={'Authorization': f'Bearer {self.api_key}'},
                    data=data
                ) as response:
                    return await response.json()
    
    async def _classify_document(self, document_id: str) -> str:
        """Classify document type using Agent Astra"""
        async with aiohttp.ClientSession() as session:
            payload = {
                'document_id': document_id,
                'classification_types': [doc.value for doc in DocumentType]
            }
            
            async with session.post(
                f'{self.base_url}/classify',
                headers=self.headers,
                json=payload
            ) as response:
                result = await response.json()
                return result['document_type']
    
    async def _extract_document_data(self, document_id: str, doc_type: str) -> Dict:
        """Extract structured data from document"""
        async with aiohttp.ClientSession() as session:
            # Get template for document type
            template = self.extraction_templates.get(doc_type, {})
            
            payload = {
                'document_id': document_id,
                'extraction_template': template,
                'return_confidence': True,
                'ocr_language': 'en'
            }
            
            async with session.post(
                f'{self.base_url}/extract',
                headers=self.headers,
                json=payload
            ) as response:
                return await response.json()
    
    def _validate_extraction(self, extraction_result: Dict, doc_type: str) -> Dict:
        """Validate extracted data against business rules"""
        issues = []
        data = extraction_result.get('data', {})
        rules = self.validation_rules.get(doc_type, {})
        
        # Required fields check
        required_fields = rules.get('required_fields', [])
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            issues.append(f"Missing required fields: {', '.join(missing_fields)}")
        
        # Value validation
        for field, rule in rules.get('field_rules', {}).items():
            if field in data:
                value = data[field]
                
                # Type validation
                if 'type' in rule and not isinstance(value, rule['type']):
                    issues.append(f"{field} has invalid type")
                
                # Range validation
                if 'min' in rule and value < rule['min']:
                    issues.append(f"{field} below minimum value")
                if 'max' in rule and value > rule['max']:
                    issues.append(f"{field} above maximum value")
                
                # Pattern validation
                if 'pattern' in rule and not rule['pattern'].match(str(value)):
                    issues.append(f"{field} has invalid format")
        
        # Calculate completeness
        total_fields = len(required_fields) + len(rules.get('optional_fields', []))
        filled_fields = len([k for k, v in data.items() if v is not None])
        completeness = (filled_fields / total_fields * 100) if total_fields > 0 else 0
        
        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'completeness': completeness,
            'warnings': self._generate_warnings(data, doc_type)
        }
    
    def _analyze_document(self, extraction_result: Dict, doc_type: str, metadata: Dict) -> Dict:
        """Perform advanced analytics on extracted data"""
        data = extraction_result.get('data', {})
        anomalies = []
        insights = []
        risk_factors = []
        
        # Document-specific analysis
        if doc_type == DocumentType.PURCHASE_ORDER.value:
            analysis = self._analyze_purchase_order(data, metadata)
        elif doc_type == DocumentType.COMMERCIAL_INVOICE.value:
            analysis = self._analyze_invoice(data, metadata)
        elif doc_type == DocumentType.BILL_OF_LADING.value:
            analysis = self._analyze_bol(data, metadata)
        else:
            analysis = self._generic_analysis(data, metadata)
        
        anomalies.extend(analysis.get('anomalies', []))
        insights.extend(analysis.get('insights', []))
        risk_factors.extend(analysis.get('risk_factors', []))
        
        # Cross-reference analysis if historical data available
        if metadata.get('historical_data'):
            cross_analysis = self._cross_reference_analysis(data, metadata['historical_data'], doc_type)
            anomalies.extend(cross_analysis.get('anomalies', []))
            insights.extend(cross_analysis.get('insights', []))
        
        # Calculate risk score
        risk_score = self._calculate_risk_score(risk_factors)
        
        return {
            'anomalies': anomalies,
            'insights': insights,
            'risk_factors': risk_factors,
            'risk_score': risk_score,
            'recommendations': self._generate_recommendations(anomalies, insights, risk_factors)
        }
    
    def _analyze_purchase_order(self, data: Dict, metadata: Dict) -> Dict:
        """Specific analysis for purchase orders"""
        anomalies = []
        insights = []
        risk_factors = []
        
        # Price analysis
        if 'unit_price' in data and 'historical_avg_price' in metadata:
            price_variance = (data['unit_price'] - metadata['historical_avg_price']) / metadata['historical_avg_price']
            if abs(price_variance) > 0.1:  # 10% threshold
                anomalies.append(f"Price variance of {price_variance*100:.1f}% from historical average")
                if price_variance > 0:
                    risk_factors.append({'type': 'cost_increase', 'severity': 'medium', 'value': price_variance})
        
        # Quantity analysis
        if 'quantity' in data and 'typical_order_size' in metadata:
            size_ratio = data['quantity'] / metadata['typical_order_size']
            if size_ratio > 2:
                insights.append(f"Order size {size_ratio:.1f}x larger than typical")
            elif size_ratio < 0.5:
                insights.append(f"Order size {size_ratio:.1f}x smaller than typical")
        
        # Lead time analysis
        if 'delivery_date' in data and 'order_date' in data:
            lead_time = (datetime.fromisoformat(data['delivery_date']) - datetime.fromisoformat(data['order_date'])).days
            if lead_time > metadata.get('typical_lead_time', 30) * 1.5:
                risk_factors.append({'type': 'long_lead_time', 'severity': 'low', 'value': lead_time})
        
        # Payment terms analysis
        payment_terms = data.get('payment_terms', '')
        if 'COD' in payment_terms or 'advance' in payment_terms.lower():
            risk_factors.append({'type': 'payment_risk', 'severity': 'high', 'value': payment_terms})
        
        return {
            'anomalies': anomalies,
            'insights': insights,
            'risk_factors': risk_factors
        }
    
    def _analyze_invoice(self, data: Dict, metadata: Dict) -> Dict:
        """Specific analysis for commercial invoices"""
        anomalies = []
        insights = []
        risk_factors = []
        
        # Invoice amount validation
        if 'total_amount' in data and 'po_amount' in metadata:
            amount_variance = (data['total_amount'] - metadata['po_amount']) / metadata['po_amount']
            if abs(amount_variance) > 0.02:  # 2% threshold
                anomalies.append(f"Invoice amount differs from PO by {amount_variance*100:.1f}%")
        
        # Payment terms compliance
        if 'payment_terms' in data:
            terms_days = self._parse_payment_terms(data['payment_terms'])
            if terms_days > metadata.get('standard_payment_days', 30):
                insights.append(f"Extended payment terms: {terms_days} days")
            elif terms_days < metadata.get('standard_payment_days', 30):
                insights.append(f"Favorable payment terms: {terms_days} days - consider early payment discount")
        
        # Currency exposure
        if 'currency' in data and data['currency'] != metadata.get('base_currency', 'USD'):
            risk_factors.append({'type': 'currency_exposure', 'severity': 'medium', 'currency': data['currency']})
        
        return {
            'anomalies': anomalies,
            'insights': insights,
            'risk_factors': risk_factors
        }
    
    def _analyze_bol(self, data: Dict, metadata: Dict) -> Dict:
        """Specific analysis for bills of lading"""
        anomalies = []
        insights = []
        risk_factors = []
        
        # Transit time analysis
        if 'ship_date' in data and 'eta' in data:
            transit_days = (datetime.fromisoformat(data['eta']) - datetime.fromisoformat(data['ship_date'])).days
            typical_transit = metadata.get('typical_transit_days', {}).get(data.get('route', 'default'), 30)
            
            if transit_days > typical_transit * 1.2:
                risk_factors.append({'type': 'delayed_shipment', 'severity': 'medium', 'days': transit_days})
                anomalies.append(f"Transit time {transit_days} days exceeds typical by {transit_days - typical_transit} days")
        
        # Container utilization
        if 'container_count' in data and 'total_volume' in data:
            utilization = self._calculate_container_utilization(data['total_volume'], data['container_count'])
            if utilization < 0.8:
                insights.append(f"Container utilization at {utilization*100:.0f}% - opportunity for consolidation")
        
        # Port congestion risk
        if 'destination_port' in data:
            congestion_level = metadata.get('port_congestion', {}).get(data['destination_port'], 'low')
            if congestion_level in ['high', 'severe']:
                risk_factors.append({'type': 'port_congestion', 'severity': congestion_level, 'port': data['destination_port']})
        
        return {
            'anomalies': anomalies,
            'insights': insights,
            'risk_factors': risk_factors
        }
    
    def _cross_reference_analysis(self, current_data: Dict, historical_data: List[Dict], doc_type: str) -> Dict:
        """Analyze current document against historical patterns"""
        anomalies = []
        insights = []
        
        # Convert to DataFrame for easier analysis
        df_historical = pd.DataFrame(historical_data)
        
        # Identify numeric fields
        numeric_fields = [col for col in current_data.keys() if col in df_historical.columns and pd.api.types.is_numeric_dtype(df_historical[col])]
        
        for field in numeric_fields:
            if field in current_data and current_data[field] is not None:
                historical_values = df_historical[field].dropna()
                if len(historical_values) > 5:  # Need sufficient history
                    mean = historical_values.mean()
                    std = historical_values.std()
                    current_value = float(current_data[field])
                    
                    # Z-score analysis
                    z_score = (current_value - mean) / std if std > 0 else 0
                    
                    if abs(z_score) > 2:  # 2 standard deviations
                        anomalies.append(f"{field} value {current_value} is {z_score:.1f} standard deviations from mean")
                    
                    # Trend analysis
                    if len(historical_values) > 10:
                        trend = np.polyfit(range(len(historical_values)), historical_values, 1)[0]
                        expected_next = mean + trend * len(historical_values)
                        if abs(current_value - expected_next) / expected_next > 0.2:  # 20% deviation from trend
                            insights.append(f"{field} deviates {((current_value/expected_next)-1)*100:.0f}% from trend")
        
        # Pattern recognition for categorical fields
        categorical_fields = [col for col in current_data.keys() if col in df_historical.columns and pd.api.types.is_string_dtype(df_historical[col])]
        
        for field in categorical_fields:
            if field in current_data and current_data[field] is not None:
                value_counts = df_historical[field].value_counts()
                if current_data[field] not in value_counts.index[:5]:  # Not in top 5 most common
                    insights.append(f"Unusual {field}: {current_data[field]}")
        
        return {
            'anomalies': anomalies,
            'insights': insights
        }
    
    def _calculate_risk_score(self, risk_factors: List[Dict]) -> float:
        """Calculate overall risk score from identified risk factors"""
        if not risk_factors:
            return 0
        
        severity_weights = {
            'low': 1,
            'medium': 2,
            'high': 3,
            'critical': 5
        }
        
        total_weight = sum(severity_weights.get(factor.get('severity', 'low'), 1) for factor in risk_factors)
        max_possible = len(risk_factors) * 5  # All critical
        
        return min(100, (total_weight / max_possible * 100) if max_possible > 0 else 0)
    
    def _generate_recommendations(self, anomalies: List[str], insights: List[str], risk_factors: List[Dict]) -> List[str]:
        """Generate actionable recommendations based on analysis"""
        recommendations = []
        
        # Risk-based recommendations
        high_risks = [r for r in risk_factors if r.get('severity') in ['high', 'critical']]
        if high_risks:
            recommendations.append("Immediate attention required for high-risk factors")
            
            for risk in high_risks:
                if risk['type'] == 'payment_risk':
                    recommendations.append("Consider trade credit insurance or letter of credit")
                elif risk['type'] == 'currency_exposure':
                    recommendations.append("Evaluate currency hedging options")
                elif risk['type'] == 'port_congestion':
                    recommendations.append("Consider alternative routing or expedited clearance")
        
        # Insight-based recommendations
        for insight in insights:
            if 'payment terms' in insight and 'favorable' in insight.lower():
                recommendations.append("Optimize cash flow by taking early payment discount")
            elif 'container utilization' in insight:
                recommendations.append("Consolidate shipments to improve container utilization")
            elif 'order size' in insight and 'larger' in insight:
                recommendations.append("Verify inventory capacity and adjust safety stock")
        
        # Anomaly-based recommendations
        if len(anomalies) > 3:
            recommendations.append("Multiple anomalies detected - recommend manual review")
        
        return recommendations[:5]  # Top 5 recommendations
    
    def _generate_warnings(self, data: Dict, doc_type: str) -> List[str]:
        """Generate warnings based on document data"""
        warnings = []
        
        # Date-based warnings
        if doc_type == DocumentType.LETTER_OF_CREDIT.value:
            if 'expiry_date' in data:
                expiry = datetime.fromisoformat(data['expiry_date'])
                days_to_expiry = (expiry - datetime.utcnow()).days
                if days_to_expiry < 30:
                    warnings.append(f"LC expires in {days_to_expiry} days")
        
        # Amount warnings
        if 'total_amount' in data and data['total_amount'] > 1000000:
            warnings.append("High-value transaction - ensure additional verification")
        
        return warnings
    
    def _aggregate_batch_results(self, results: List[Dict]) -> Dict:
        """Aggregate results from batch processing"""
        successful = [r for r in results if isinstance(r, dict) and r.get('success')]
        failed = [r for r in results if isinstance(r, dict) and not r.get('success')]
        exceptions = [r for r in results if isinstance(r, Exception)]
        
        # Calculate aggregate metrics
        avg_processing_time = np.mean([r['metrics']['processing_time'] for r in successful]) if successful else 0
        avg_confidence = np.mean([r['metrics']['extraction_confidence'] for r in successful]) if successful else 0
        total_anomalies = sum(len(r['analytics']['anomalies']) for r in successful)
        total_risks = sum(len(r['analytics']['risk_factors']) for r in successful)
        
        # Document type distribution
        doc_type_dist = {}
        for r in successful:
            doc_type = r['document_type']
            doc_type_dist[doc_type] = doc_type_dist.get(doc_type, 0) + 1
        
        return {
            'summary': {
                'total_processed': len(results),
                'successful': len(successful),
                'failed': len(failed) + len(exceptions),
                'success_rate': len(successful) / len(results) * 100 if results else 0
            },
            'metrics': {
                'avg_processing_time': avg_processing_time,
                'avg_confidence': avg_confidence,
                'total_anomalies': total_anomalies,
                'total_risks': total_risks
            },
            'document_types': doc_type_dist,
            'results': successful,
            'errors': [{'error': str(e)} for e in exceptions] + failed
        }
    
    def _load_extraction_templates(self) -> Dict:
        """Load document extraction templates"""
        return {
            DocumentType.PURCHASE_ORDER.value: {
                'fields': [
                    {'name': 'po_number', 'type': 'string', 'required': True},
                    {'name': 'order_date', 'type': 'date', 'required': True},
                    {'name': 'supplier_name', 'type': 'string', 'required': True},
                    {'name': 'buyer_name', 'type': 'string', 'required': True},
                    {'name': 'delivery_date', 'type': 'date', 'required': True},
                    {'name': 'payment_terms', 'type': 'string', 'required': True},
                    {'name': 'total_amount', 'type': 'number', 'required': True},
                    {'name': 'currency', 'type': 'string', 'required': True},
                    {'name': 'line_items', 'type': 'table', 'columns': [
                        'item_code', 'description', 'quantity', 'unit_price', 'total'
                    ]}
                ]
            },
            DocumentType.COMMERCIAL_INVOICE.value: {
                'fields': [
                    {'name': 'invoice_number', 'type': 'string', 'required': True},
                    {'name': 'invoice_date', 'type': 'date', 'required': True},
                    {'name': 'po_number', 'type': 'string', 'required': False},
                    {'name': 'seller_name', 'type': 'string', 'required': True},
                    {'name': 'buyer_name', 'type': 'string', 'required': True},
                    {'name': 'payment_terms', 'type': 'string', 'required': True},
                    {'name': 'due_date', 'type': 'date', 'required': True},
                    {'name': 'total_amount', 'type': 'number', 'required': True},
                    {'name': 'tax_amount', 'type': 'number', 'required': False},
                    {'name': 'currency', 'type': 'string', 'required': True}
                ]
            },
            DocumentType.BILL_OF_LADING.value: {
                'fields': [
                    {'name': 'bol_number', 'type': 'string', 'required': True},
                    {'name': 'ship_date', 'type': 'date', 'required': True},
                    {'name': 'carrier_name', 'type': 'string', 'required': True},
                    {'name': 'vessel_name', 'type': 'string', 'required': False},
                    {'name': 'origin_port', 'type': 'string', 'required': True},
                    {'name': 'destination_port', 'type': 'string', 'required': True},
                    {'name': 'eta', 'type': 'date', 'required': True},
                    {'name': 'container_numbers', 'type': 'array', 'required': True},
                    {'name': 'total_weight', 'type': 'number', 'required': True},
                    {'name': 'total_volume', 'type': 'number', 'required': False}
                ]
            }
        }
    
    def _load_validation_rules(self) -> Dict:
        """Load validation rules for each document type"""
        import re
        
        return {
            DocumentType.PURCHASE_ORDER.value: {
                'required_fields': ['po_number', 'order_date', 'supplier_name', 'total_amount'],
                'field_rules': {
                    'total_amount': {'type': (int, float), 'min': 0},
                    'po_number': {'pattern': re.compile(r'^PO-\d{6,}$')},
                    'delivery_date': {'type': str}  # Should be after order_date
                }
            },
            DocumentType.COMMERCIAL_INVOICE.value: {
                'required_fields': ['invoice_number', 'invoice_date', 'total_amount'],
                'field_rules': {
                    'total_amount': {'type': (int, float), 'min': 0},
                    'tax_amount': {'type': (int, float), 'min': 0}
                }
            }
        }
    
    def _parse_payment_terms(self, terms: str) -> int:
        """Parse payment terms to days"""
        terms_lower = terms.lower()
        if 'net' in terms_lower:
            # Extract number after 'net'
            import re
            match = re.search(r'net\s*(\d+)', terms_lower)
            if match:
                return int(match.group(1))
        elif 'cod' in terms_lower or 'cash' in terms_lower:
            return 0
        elif 'advance' in terms_lower:
            return -1  # Negative indicates advance payment
        return 30  # Default
    
    def _calculate_container_utilization(self, volume: float, container_count: int) -> float:
        """Calculate container utilization percentage"""
        # Standard 40ft container volume in cubic meters
        CONTAINER_VOLUME_40FT = 67.7
        total_capacity = container_count * CONTAINER_VOLUME_40FT
        
        return min(1.0, volume / total_capacity) if total_capacity > 0 else 0

class DocumentIntelligenceAnalytics:
    """Analytics engine for document intelligence metrics"""
    
    def calculate_document_intelligence_score(self, org_data: pd.DataFrame) -> Dict:
        """Calculate the Document Intelligence score (fourth dimension)"""
        
        # Component scores
        compliance_score = self._calculate_compliance_score(org_data)
        visibility_score = self._calculate_visibility_score(org_data)
        efficiency_score = self._calculate_efficiency_score(org_data)
        accuracy_score = self._calculate_accuracy_score(org_data)
        
        # Weighted average for overall document intelligence
        document_score = (
            compliance_score * 0.30 +
            visibility_score * 0.25 +
            efficiency_score * 0.25 +
            accuracy_score * 0.20
        )
        
        return {
            'document_intelligence_score': round(document_score, 2),
            'components': {
                'compliance': round(compliance_score, 2),
                'visibility': round(visibility_score, 2),
                'efficiency': round(efficiency_score, 2),
                'accuracy': round(accuracy_score, 2)
            },
            'insights': self._generate_document_insights(
                compliance_score, visibility_score, efficiency_score, accuracy_score
            )
        }
    
    def _calculate_compliance_score(self, data: pd.DataFrame) -> float:
        """Calculate compliance score based on document completeness and validity"""
        metrics = []
        
        # Certificate validity
        if 'valid_certificates_pct' in data.columns:
            metrics.append(data['valid_certificates_pct'].mean())
        else:
            metrics.append(80)  # Default
        
        # Document completeness
        if 'document_completeness' in data.columns:
            metrics.append(data['document_completeness'].mean())
        else:
            metrics.append(85)  # Default
        
        # Regulatory compliance
        if 'compliance_violations' in data.columns:
            violation_rate = data['compliance_violations'].sum() / len(data) * 100
            metrics.append(100 - violation_rate)
        else:
            metrics.append(95)  # Default
        
        # Audit readiness
        if 'audit_ready_documents' in data.columns:
            metrics.append(data['audit_ready_documents'].mean())
        else:
            metrics.append(75)  # Default
        
        return np.mean(metrics)
    
    def _calculate_visibility_score(self, data: pd.DataFrame) -> float:
        """Calculate supply chain visibility through document digitization"""
        metrics = []
        
        # Document digitization rate
        if 'is_digital' in data.columns:
            digital_rate = data['is_digital'].sum() / len(data) * 100
            metrics.append(digital_rate)
        else:
            metrics.append(60)  # Default
        
        # Real-time tracking availability
        if 'has_tracking' in data.columns:
            tracking_rate = data['has_tracking'].sum() / len(data) * 100
            metrics.append(tracking_rate)
        else:
            metrics.append(70)  # Default
        
        # Data extraction confidence
        if 'extraction_confidence' in data.columns:
            metrics.append(data['extraction_confidence'].mean())
        else:
            metrics.append(85)  # Default
        
        # System integration level
        if 'is_integrated' in data.columns:
            integration_rate = data['is_integrated'].sum() / len(data) * 100
            metrics.append(integration_rate)
        else:
            metrics.append(50)  # Default
        
        return np.mean(metrics)
    
    def _calculate_efficiency_score(self, data: pd.DataFrame) -> float:
        """Calculate document processing efficiency"""
        metrics = []
        
        # Processing time (normalize to 0-100, where faster is better)
        if 'processing_time_seconds' in data.columns:
            avg_time = data['processing_time_seconds'].mean()
            # Assume 300 seconds (5 min) is 0 score, 10 seconds is 100 score
            time_score = max(0, min(100, (300 - avg_time) / 290 * 100))
            metrics.append(time_score)
        else:
            metrics.append(75)  # Default
        
        # Automation rate
        if 'is_automated' in data.columns:
            automation_rate = data['is_automated'].sum() / len(data) * 100
            metrics.append(automation_rate)
        else:
            metrics.append(65)  # Default
        
        # Error rate (inverse)
        if 'has_errors' in data.columns:
            error_rate = data['has_errors'].sum() / len(data) * 100
            metrics.append(100 - error_rate)
        else:
            metrics.append(90)  # Default
        
        # Straight-through processing
        if 'required_manual_intervention' in data.columns:
            stp_rate = 100 - (data['required_manual_intervention'].sum() / len(data) * 100)
            metrics.append(stp_rate)
        else:
            metrics.append(70)  # Default
        
        return np.mean(metrics)
    
    def _calculate_accuracy_score(self, data: pd.DataFrame) -> float:
        """Calculate document data accuracy"""
        metrics = []
        
        # Data match rate (e.g., PO vs Invoice)
        if 'data_match_score' in data.columns:
            metrics.append(data['data_match_score'].mean())
        else:
            metrics.append(92)  # Default
        
        # Amendment rate (inverse)
        if 'required_amendments' in data.columns:
            amendment_rate = data['required_amendments'].sum() / len(data) * 100
            metrics.append(100 - amendment_rate)
        else:
            metrics.append(88)  # Default
        
        # Validation pass rate
        if 'passed_validation' in data.columns:
            pass_rate = data['passed_validation'].sum() / len(data) * 100
            metrics.append(pass_rate)
        else:
            metrics.append(85)  # Default
        
        return np.mean(metrics)
    
    def _generate_document_insights(self, compliance: float, visibility: float, 
                                  efficiency: float, accuracy: float) -> List[str]:
        """Generate insights based on document intelligence scores"""
        insights = []
        
        # Find weakest area
        scores = {
            'compliance': compliance,
            'visibility': visibility,
            'efficiency': efficiency,
            'accuracy': accuracy
        }
        
        weakest = min(scores, key=scores.get)
        strongest = max(scores, key=scores.get)
        
        # General insights
        if scores[weakest] < 60:
            insights.append(f"Critical improvement needed in document {weakest} (score: {scores[weakest]:.0f})")
        
        if scores[strongest] > 85:
            insights.append(f"Excellent document {strongest} performance (score: {scores[strongest]:.0f})")
        
        # Specific insights
        if compliance < 70:
            insights.append("Implement automated compliance checking to reduce violations")
        
        if visibility < 65:
            insights.append("Increase document digitization for better supply chain visibility")
        
        if efficiency < 70:
            insights.append("Automate document processing to reduce manual intervention")
        
        if accuracy < 75:
            insights.append("Implement data validation rules to improve accuracy")
        
        # Opportunity insights
        avg_score = np.mean(list(scores.values()))
        if avg_score > 80:
            insights.append("Ready for advanced AI-powered predictive analytics")
        elif avg_score > 70:
            insights.append("Good foundation for process automation initiatives")
        else:
            insights.append("Focus on basic digitization before advanced features")
        
        return insights[:5]