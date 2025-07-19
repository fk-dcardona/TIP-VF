"""
Enhanced Document Processor for Unified Document Intelligence Protocol
Extends base TradeDocumentProcessor with cross-referencing and inventory intelligence
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json
import pandas as pd
import numpy as np
from collections import defaultdict
import uuid

from document_processor import TradeDocumentProcessor
from models_enhanced import UnifiedTransaction, DocumentInventoryLink
from models import db, TradeDocument

class EnhancedDocumentProcessor(TradeDocumentProcessor):
    """Enhanced processor that creates unified transactions from documents"""
    
    def __init__(self):
        super().__init__()
        self.cost_variance_threshold = 0.05  # 5% threshold for cost variances
        self.quantity_discrepancy_threshold = 0.05  # 5% threshold for quantity discrepancies
    
    async def process_and_link_document(self, file_path: str, org_id: str, doc_type: str = 'auto') -> Dict:
        """Process document and create/update unified transactions"""
        
        # 1. Standard document processing
        doc_result = await self.process_single_document(file_path, doc_type)
        
        if not doc_result['success']:
            return doc_result
        
        # 2. Extract structured data
        extracted_data = doc_result['extracted_data']
        document_id = doc_result['document_id']
        
        # 3. Create unified transactions
        unified_transactions = self._create_unified_transactions(
            extracted_data, doc_type, org_id, document_id
        )
        
        # 4. Cross-reference with existing data
        cross_reference_results = self._cross_reference_with_existing(
            unified_transactions, org_id
        )
        
        # 5. Update inventory status
        inventory_updates = self._update_inventory_status(
            unified_transactions, cross_reference_results, org_id
        )
        
        # 6. Generate alerts
        alerts = self._generate_inventory_alerts(inventory_updates)
        
        # 7. Save to database
        self._save_transactions_to_db(unified_transactions)
        
        return {
            **doc_result,
            'unified_transactions': [t.to_dict() for t in unified_transactions],
            'cross_reference_results': cross_reference_results,
            'inventory_updates': inventory_updates,
            'alerts': alerts
        }
    
    def _create_unified_transactions(self, extracted_data: Dict, doc_type: str, 
                                   org_id: str, document_id: str) -> List[UnifiedTransaction]:
        """Create unified transactions from document data"""
        
        transactions = []
        
        if doc_type == 'purchase_order':
            # Create PURCHASE transactions for each line item
            line_items = extracted_data.get('line_items', [])
            for item in line_items:
                transaction = UnifiedTransaction(
                    transaction_id=self._generate_transaction_id('PO'),
                    org_id=org_id,
                    transaction_type='PURCHASE',
                    source_document_id=document_id,
                    document_confidence=extracted_data.get('confidence', 0),
                    
                    # Product info
                    sku=item.get('item_code'),
                    product_description=item.get('description'),
                    
                    # Quantities
                    quantity=item.get('quantity'),
                    committed_quantity=item.get('quantity'),
                    
                    # Costs
                    unit_cost=item.get('unit_price'),
                    total_cost=item.get('total'),
                    planned_cost=item.get('total'),
                    
                    # Dates
                    transaction_date=self._parse_date(extracted_data.get('order_date')),
                    po_date=self._parse_date(extracted_data.get('order_date')),
                    eta_date=self._parse_date(extracted_data.get('delivery_date')),
                    
                    # Supplier info
                    supplier_name=extracted_data.get('supplier_name'),
                    
                    # Status
                    inventory_status='committed',
                    compliance_status='pending',
                    
                    # Currency
                    currency=extracted_data.get('currency', 'USD')
                )
                transactions.append(transaction)
                
        elif doc_type == 'commercial_invoice':
            # Create INVOICE transactions and update costs
            line_items = extracted_data.get('line_items', [])
            for item in line_items:
                transaction = UnifiedTransaction(
                    transaction_id=self._generate_transaction_id('INV'),
                    org_id=org_id,
                    transaction_type='INVOICE',
                    source_document_id=document_id,
                    document_confidence=extracted_data.get('confidence', 0),
                    
                    # Product info
                    sku=item.get('item_code'),
                    product_description=item.get('description'),
                    
                    # Quantities
                    quantity=item.get('quantity'),
                    
                    # Costs
                    unit_cost=item.get('unit_price'),
                    total_cost=item.get('total'),
                    actual_cost=item.get('total'),
                    
                    # Dates
                    transaction_date=self._parse_date(extracted_data.get('invoice_date')),
                    
                    # Status
                    inventory_status='billed',
                    compliance_status='pending',
                    
                    # Currency
                    currency=extracted_data.get('currency', 'USD')
                )
                transactions.append(transaction)
                
        elif doc_type == 'bill_of_lading':
            # Create SHIPMENT transactions
            transaction = UnifiedTransaction(
                transaction_id=self._generate_transaction_id('BOL'),
                org_id=org_id,
                transaction_type='SHIPMENT',
                source_document_id=document_id,
                document_confidence=extracted_data.get('confidence', 0),
                
                # Dates
                transaction_date=self._parse_date(extracted_data.get('ship_date')),
                ship_date=self._parse_date(extracted_data.get('ship_date')),
                eta_date=self._parse_date(extracted_data.get('eta')),
                
                # Status
                inventory_status='in_transit',
                compliance_status='in_progress',
                
                # Additional data stored in metadata
                city=extracted_data.get('destination_port'),
                supplier_name=extracted_data.get('shipper_name')
            )
            transactions.append(transaction)
        
        return transactions
    
    def _cross_reference_with_existing(self, new_transactions: List[UnifiedTransaction], 
                                     org_id: str) -> Dict:
        """Cross-reference new transactions with existing data"""
        
        results = {
            'matches_found': [],
            'cost_variances': [],
            'quantity_discrepancies': [],
            'timeline_updates': []
        }
        
        for transaction in new_transactions:
            if not transaction.sku:
                continue
            
            # Find related transactions for same SKU
            related_transactions = UnifiedTransaction.query.filter_by(
                org_id=org_id,
                sku=transaction.sku
            ).filter(
                UnifiedTransaction.transaction_id != transaction.transaction_id
            ).all()
            
            for related in related_transactions:
                # Check for cost variances
                if (transaction.actual_cost and related.planned_cost and 
                    transaction.transaction_type == 'INVOICE' and 
                    related.transaction_type == 'PURCHASE'):
                    
                    variance = transaction.actual_cost - related.planned_cost
                    variance_pct = (variance / related.planned_cost) * 100
                    
                    if abs(variance_pct) > self.cost_variance_threshold * 100:
                        results['cost_variances'].append({
                            'sku': transaction.sku,
                            'planned_cost': related.planned_cost,
                            'actual_cost': transaction.actual_cost,
                            'variance': variance,
                            'variance_percentage': variance_pct,
                            'po_transaction_id': related.transaction_id,
                            'invoice_transaction_id': transaction.transaction_id
                        })
                        
                        # Update transaction with variance data
                        transaction.cost_variance = variance
                        transaction.cost_variance_percentage = variance_pct
                
                # Check for quantity discrepancies
                if (transaction.quantity and related.committed_quantity and
                    abs(transaction.quantity - related.committed_quantity) > 0):
                    
                    discrepancy = transaction.quantity - related.committed_quantity
                    discrepancy_pct = (discrepancy / related.committed_quantity) * 100
                    
                    if abs(discrepancy_pct) > self.quantity_discrepancy_threshold * 100:
                        results['quantity_discrepancies'].append({
                            'sku': transaction.sku,
                            'committed_quantity': related.committed_quantity,
                            'actual_quantity': transaction.quantity,
                            'discrepancy': discrepancy,
                            'discrepancy_percentage': discrepancy_pct
                        })
        
        return results
    
    def _update_inventory_status(self, transactions: List[UnifiedTransaction], 
                               cross_ref_results: Dict, org_id: str) -> Dict:
        """Update inventory status based on document processing"""
        
        inventory_updates = {
            'compromised_items': [],
            'at_risk_items': [],
            'status_changes': []
        }
        
        # Check for compromised inventory
        for variance in cross_ref_results['cost_variances']:
            if abs(variance['variance_percentage']) > 10:
                inventory_updates['compromised_items'].append({
                    'sku': variance['sku'],
                    'reason': 'cost_variance',
                    'severity': 'high' if abs(variance['variance_percentage']) > 20 else 'medium',
                    'details': f"Cost variance of {variance['variance_percentage']:.1f}%",
                    'impact': variance['variance']
                })
        
        # Check for quantity discrepancies
        for discrepancy in cross_ref_results['quantity_discrepancies']:
            if abs(discrepancy['discrepancy_percentage']) > 5:
                inventory_updates['compromised_items'].append({
                    'sku': discrepancy['sku'],
                    'reason': 'quantity_discrepancy',
                    'severity': 'high',
                    'details': f"Quantity discrepancy: expected {discrepancy['committed_quantity']}, got {discrepancy['actual_quantity']}",
                    'impact': discrepancy['discrepancy']
                })
        
        # Update transaction statuses
        for transaction in transactions:
            if transaction.sku in [item['sku'] for item in inventory_updates['compromised_items']]:
                transaction.inventory_status = 'compromised'
                transaction.anomaly_flags = [
                    item for item in inventory_updates['compromised_items'] 
                    if item['sku'] == transaction.sku
                ]
        
        return inventory_updates
    
    def _generate_inventory_alerts(self, inventory_updates: Dict) -> List[Dict]:
        """Generate real-time alerts for inventory issues"""
        
        alerts = []
        
        for item in inventory_updates['compromised_items']:
            alert = {
                'type': 'inventory_compromised',
                'severity': item['severity'],
                'sku': item['sku'],
                'title': f"Inventory Compromised: {item['sku']}",
                'message': item['details'],
                'action_required': self._get_recommended_action(item),
                'timestamp': datetime.utcnow().isoformat(),
                'financial_impact': item.get('impact', 0)
            }
            alerts.append(alert)
        
        return alerts
    
    def _get_recommended_action(self, compromise_item: Dict) -> str:
        """Get recommended action for compromised inventory"""
        
        if compromise_item['reason'] == 'cost_variance':
            if compromise_item['severity'] == 'high':
                return "URGENT: Review supplier contract and negotiate cost adjustment"
            else:
                return "Review pricing with supplier and update cost forecasts"
        
        elif compromise_item['reason'] == 'quantity_discrepancy':
            return "Investigate shipment and file claim if necessary"
        
        return "Manual review required"
    
    def _save_transactions_to_db(self, transactions: List[UnifiedTransaction]):
        """Save unified transactions to database"""
        try:
            for transaction in transactions:
                db.session.add(transaction)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Failed to save transactions: {str(e)}")
    
    def _generate_transaction_id(self, prefix: str) -> str:
        """Generate unique transaction ID"""
        return f"{prefix}-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string to datetime object"""
        if not date_str:
            return None
        
        try:
            # Try common date formats
            for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S']:
                try:
                    return datetime.strptime(date_str, fmt)
                except ValueError:
                    continue
            return None
        except Exception:
            return None 