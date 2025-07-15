# Supply Chain Analytics Implementation Plan

## Overview
This plan details how to implement the Finkargo Analytics Supply Chain Triangle framework into the current application, focusing on the balance between Service, Cost, and Capital optimization.

## Phase 1: Database Schema Enhancement (Priority: HIGH)

### 1.1 Core Analytics Tables

```sql
-- 1. Supply Chain Triangle Scores
CREATE TABLE triangle_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id VARCHAR(100) NOT NULL REFERENCES organizations(id),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Triangle Vertex Scores (0-100)
    service_score DECIMAL(5, 2) NOT NULL,
    cost_score DECIMAL(5, 2) NOT NULL,
    capital_score DECIMAL(5, 2) NOT NULL,
    overall_score DECIMAL(5, 2) NOT NULL, -- Harmonic mean
    
    -- Component Metrics
    metrics JSONB NOT NULL,
    
    -- Indexing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_triangle_org_date (org_id, calculated_at DESC)
);

-- 2. Product Analytics
CREATE TABLE product_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id VARCHAR(100) NOT NULL REFERENCES organizations(id),
    sku VARCHAR(255) NOT NULL,
    
    -- Core Metrics
    current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
    sales_velocity DECIMAL(10, 4) NOT NULL DEFAULT 0, -- units/day
    days_of_supply INTEGER NOT NULL DEFAULT 0,
    inventory_turnover DECIMAL(5, 2) NOT NULL DEFAULT 0,
    
    -- Financial Metrics
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    gross_margin DECIMAL(5, 4) NOT NULL DEFAULT 0,
    roi_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    
    -- Operational Metrics
    reorder_point DECIMAL(10, 2),
    lead_time_days INTEGER DEFAULT 7,
    safety_stock_days INTEGER DEFAULT 3,
    
    -- Status
    stock_status VARCHAR(20) CHECK (stock_status IN ('healthy', 'low_stock', 'stockout', 'excess')),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(org_id, sku),
    INDEX idx_product_status (org_id, stock_status)
);

-- 3. Supplier Performance
CREATE TABLE supplier_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id VARCHAR(100) NOT NULL REFERENCES organizations(id),
    supplier_name VARCHAR(255) NOT NULL,
    
    -- Performance Scores (0-100)
    delivery_score DECIMAL(5, 2) DEFAULT 0,
    quality_score DECIMAL(5, 2) DEFAULT 0,
    cost_score DECIMAL(5, 2) DEFAULT 0,
    responsiveness_score DECIMAL(5, 2) DEFAULT 0,
    overall_score DECIMAL(5, 2) DEFAULT 0,
    
    -- Metrics
    on_time_delivery_rate DECIMAL(5, 4) DEFAULT 0,
    defect_rate DECIMAL(5, 4) DEFAULT 0,
    price_variance DECIMAL(5, 2) DEFAULT 0,
    average_response_hours INTEGER DEFAULT 24,
    
    last_evaluated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, supplier_name)
);

-- 4. Financial Metrics
CREATE TABLE financial_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id VARCHAR(100) NOT NULL REFERENCES organizations(id),
    period_date DATE NOT NULL,
    
    -- Working Capital
    inventory_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
    accounts_receivable DECIMAL(15, 2) DEFAULT 0,
    accounts_payable DECIMAL(15, 2) DEFAULT 0,
    working_capital DECIMAL(15, 2) DEFAULT 0,
    working_capital_ratio DECIMAL(5, 2) DEFAULT 0,
    
    -- Cash Conversion
    days_inventory_outstanding INTEGER DEFAULT 0,
    days_sales_outstanding INTEGER DEFAULT 0,
    days_payable_outstanding INTEGER DEFAULT 0,
    cash_conversion_cycle INTEGER DEFAULT 0,
    
    -- Efficiency
    inventory_turnover DECIMAL(5, 2) DEFAULT 0,
    return_on_capital_employed DECIMAL(5, 2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, period_date)
);

-- 5. Alert Configuration
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id VARCHAR(100) NOT NULL REFERENCES organizations(id),
    alert_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    condition VARCHAR(20) CHECK (condition IN ('greater_than', 'less_than', 'equals', 'between')),
    threshold_value DECIMAL(15, 4),
    threshold_min DECIMAL(15, 4),
    threshold_max DECIMAL(15, 4),
    severity VARCHAR(20) CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Alert Instances
CREATE TABLE alert_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id VARCHAR(100) NOT NULL REFERENCES organizations(id),
    alert_rule_id UUID REFERENCES alert_rules(id),
    sku VARCHAR(255),
    metric_value DECIMAL(15, 4),
    severity VARCHAR(20),
    status VARCHAR(20) CHECK (status IN ('active', 'acknowledged', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    INDEX idx_alert_status (org_id, status, created_at DESC)
);
```

## Phase 2: Core Analytics Engine Implementation

### 2.1 Update Supply Chain Engine

```python
# supply_chain_engine.py - Enhanced version

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any

class SupplyChainAnalyticsEngine:
    """Enhanced analytics engine with Triangle framework"""
    
    def __init__(self):
        self.config = {
            'lead_time_days': 7,
            'safety_stock_days': 3,
            'holding_cost_rate': 0.25,  # 25% annual
            'stockout_cost_multiple': 3,  # 3x margin
            'target_service_level': 0.95
        }
    
    def calculate_triangle_scores(self, data: pd.DataFrame, financial_data: Dict) -> Dict:
        """Calculate the Supply Chain Triangle scores"""
        
        # Service Score Components
        service_metrics = self._calculate_service_metrics(data)
        service_score = self._normalize_service_score(service_metrics)
        
        # Cost Score Components
        cost_metrics = self._calculate_cost_metrics(data, financial_data)
        cost_score = self._normalize_cost_score(cost_metrics)
        
        # Capital Score Components
        capital_metrics = self._calculate_capital_metrics(data, financial_data)
        capital_score = self._normalize_capital_score(capital_metrics)
        
        # Overall Score (Harmonic Mean)
        overall_score = self._calculate_harmonic_mean([service_score, cost_score, capital_score])
        
        return {
            'service_score': round(service_score, 2),
            'cost_score': round(cost_score, 2),
            'capital_score': round(capital_score, 2),
            'overall_score': round(overall_score, 2),
            'metrics': {
                'service': service_metrics,
                'cost': cost_metrics,
                'capital': capital_metrics
            }
        }
    
    def _calculate_service_metrics(self, data: pd.DataFrame) -> Dict:
        """Calculate service-related metrics"""
        total_demand = data['sales_quantity'].sum() if 'sales_quantity' in data else 0
        fulfilled_demand = data[data['fulfilled'] == True]['sales_quantity'].sum() if 'fulfilled' in data else total_demand
        stockout_events = len(data[data['current_stock'] == 0]) if 'current_stock' in data else 0
        
        fill_rate = (fulfilled_demand / total_demand * 100) if total_demand > 0 else 0
        stockout_risk = (stockout_events / len(data) * 100) if len(data) > 0 else 0
        
        # Calculate on-time delivery (placeholder - needs supplier data)
        on_time_delivery = 95.0  # Default value
        
        # Customer satisfaction (composite score)
        customer_satisfaction = min(100, fill_rate * 0.6 + (100 - stockout_risk) * 0.4)
        
        return {
            'fill_rate': round(fill_rate, 2),
            'stockout_risk': round(stockout_risk, 2),
            'on_time_delivery': round(on_time_delivery, 2),
            'customer_satisfaction': round(customer_satisfaction, 2)
        }
    
    def _calculate_cost_metrics(self, data: pd.DataFrame, financial_data: Dict) -> Dict:
        """Calculate cost-related metrics"""
        if 'selling_price' in data.columns and 'unit_cost' in data.columns:
            data['margin'] = (data['selling_price'] - data['unit_cost']) / data['selling_price']
            gross_margin = data['margin'].mean() * 100 if len(data) > 0 else 0
        else:
            gross_margin = 30.0  # Default value
        
        # Calculate margin trend (simplified)
        margin_trend = 0.5  # Placeholder for trend calculation
        
        # Cost optimization potential
        cost_optimization_potential = self._calculate_cost_optimization_potential(data)
        
        # Price variance
        if 'unit_cost' in data.columns:
            price_variance = data['unit_cost'].std() / data['unit_cost'].mean() * 100 if data['unit_cost'].mean() > 0 else 0
        else:
            price_variance = 5.0
        
        return {
            'gross_margin': round(gross_margin, 2),
            'margin_trend': round(margin_trend, 2),
            'cost_optimization_potential': round(cost_optimization_potential, 2),
            'price_variance': round(price_variance, 2)
        }
    
    def _calculate_capital_metrics(self, data: pd.DataFrame, financial_data: Dict) -> Dict:
        """Calculate capital-related metrics"""
        # Inventory turnover
        if 'current_stock' in data.columns and 'sales_velocity' in data.columns:
            avg_inventory = data['current_stock'].mean()
            annual_sales = data['sales_velocity'].sum() * 365
            inventory_turnover = annual_sales / avg_inventory if avg_inventory > 0 else 0
        else:
            inventory_turnover = 6.0  # Default value
        
        # Working capital ratio
        working_capital_ratio = financial_data.get('working_capital_ratio', 1.5)
        
        # Cash conversion cycle
        dio = financial_data.get('days_inventory_outstanding', 60)
        dso = financial_data.get('days_sales_outstanding', 45)
        dpo = financial_data.get('days_payable_outstanding', 30)
        cash_conversion_cycle = dio + dso - dpo
        
        # Return on capital employed
        roce = financial_data.get('return_on_capital_employed', 15.0)
        
        return {
            'inventory_turnover': round(inventory_turnover, 2),
            'working_capital_ratio': round(working_capital_ratio, 2),
            'cash_conversion_cycle': round(cash_conversion_cycle, 0),
            'return_on_capital_employed': round(roce, 2)
        }
    
    def _normalize_service_score(self, metrics: Dict) -> float:
        """Normalize service metrics to 0-100 scale"""
        return min(100, max(0,
            metrics['fill_rate'] * 0.3 +
            (100 - metrics['stockout_risk']) * 0.3 +
            metrics['on_time_delivery'] * 0.2 +
            metrics['customer_satisfaction'] * 0.2
        ))
    
    def _normalize_cost_score(self, metrics: Dict) -> float:
        """Normalize cost metrics to 0-100 scale"""
        return min(100, max(0,
            min(metrics['gross_margin'] * 2, 100) * 0.4 +
            (50 + metrics['margin_trend'] * 10) * 0.2 +
            metrics['cost_optimization_potential'] * 0.2 +
            (100 - metrics['price_variance'] * 2) * 0.2
        ))
    
    def _normalize_capital_score(self, metrics: Dict) -> float:
        """Normalize capital metrics to 0-100 scale"""
        turnover_score = min(metrics['inventory_turnover'] * 10, 100)
        working_capital_score = min(metrics['working_capital_ratio'] * 50, 100)
        ccc_score = max(0, 100 - metrics['cash_conversion_cycle'])
        roce_score = min(metrics['return_on_capital_employed'] * 5, 100)
        
        return min(100, max(0,
            turnover_score * 0.3 +
            working_capital_score * 0.2 +
            ccc_score * 0.3 +
            roce_score * 0.2
        ))
    
    def _calculate_harmonic_mean(self, values: List[float]) -> float:
        """Calculate harmonic mean of values"""
        if not values or any(v == 0 for v in values):
            return 0
        return len(values) / sum(1/v for v in values)
    
    def _calculate_cost_optimization_potential(self, data: pd.DataFrame) -> float:
        """Calculate potential for cost optimization"""
        potential_score = 0
        
        # Check for excess inventory
        if 'days_of_stock' in data.columns:
            excess_items = len(data[data['days_of_stock'] > 90])
            potential_score += (excess_items / len(data) * 30) if len(data) > 0 else 0
        
        # Check for slow-moving items
        if 'inventory_turnover' in data.columns:
            slow_movers = len(data[data['inventory_turnover'] < 4])
            potential_score += (slow_movers / len(data) * 30) if len(data) > 0 else 0
        
        # Check for price variance opportunities
        if 'unit_cost' in data.columns:
            high_cost_variance = len(data[data['unit_cost'] > data['unit_cost'].mean() * 1.2])
            potential_score += (high_cost_variance / len(data) * 40) if len(data) > 0 else 0
        
        return min(100, potential_score)
    
    def calculate_product_analytics(self, data: pd.DataFrame) -> pd.DataFrame:
        """Calculate all product-level analytics"""
        analytics = data.copy()
        
        # Sales velocity (units per day)
        if 'sales_quantity' in analytics.columns:
            analytics['sales_velocity'] = analytics['sales_quantity'] / 30  # Assume 30-day period
        else:
            analytics['sales_velocity'] = 0
        
        # Days of supply
        analytics['days_of_supply'] = np.where(
            analytics['sales_velocity'] > 0,
            analytics['current_stock'] / analytics['sales_velocity'],
            999
        )
        
        # Inventory turnover (annualized)
        analytics['inventory_turnover'] = np.where(
            analytics['current_stock'] > 0,
            (analytics['sales_velocity'] * 365) / analytics['current_stock'],
            0
        )
        
        # Gross margin
        if 'selling_price' in analytics.columns and 'unit_cost' in analytics.columns:
            analytics['gross_margin'] = (analytics['selling_price'] - analytics['unit_cost']) / analytics['selling_price']
            analytics['roi_percentage'] = ((analytics['selling_price'] - analytics['unit_cost']) / analytics['unit_cost'] * 100)
        
        # Stock status
        analytics['stock_status'] = analytics.apply(self._categorize_stock_status, axis=1)
        
        # Reorder point
        analytics['reorder_point'] = analytics['sales_velocity'] * (self.config['lead_time_days'] + self.config['safety_stock_days'])
        
        return analytics
    
    def _categorize_stock_status(self, row):
        """Categorize stock status based on days of supply"""
        if row['current_stock'] == 0:
            return 'stockout'
        elif row['days_of_supply'] <= 7:
            return 'low_stock'
        elif row['days_of_supply'] > 90:
            return 'excess'
        else:
            return 'healthy'
    
    def generate_alerts(self, analytics: pd.DataFrame, alert_rules: List[Dict]) -> List[Dict]:
        """Generate alerts based on analytics and rules"""
        alerts = []
        
        for _, product in analytics.iterrows():
            # Stock level alerts
            if product['stock_status'] == 'stockout':
                alerts.append({
                    'type': 'stockout',
                    'severity': 'critical',
                    'sku': product.get('sku', 'Unknown'),
                    'message': f"Product {product.get('sku', 'Unknown')} is out of stock",
                    'metric_value': 0,
                    'action_required': 'Immediate reorder required'
                })
            elif product['stock_status'] == 'low_stock':
                alerts.append({
                    'type': 'low_stock',
                    'severity': 'high',
                    'sku': product.get('sku', 'Unknown'),
                    'message': f"Product {product.get('sku', 'Unknown')} has only {product['days_of_supply']:.0f} days of supply",
                    'metric_value': product['days_of_supply'],
                    'action_required': 'Reorder recommended'
                })
            
            # Financial alerts
            if 'roi_percentage' in product and product['roi_percentage'] < 10:
                alerts.append({
                    'type': 'low_margin',
                    'severity': 'medium',
                    'sku': product.get('sku', 'Unknown'),
                    'message': f"Product {product.get('sku', 'Unknown')} has low ROI of {product['roi_percentage']:.1f}%",
                    'metric_value': product['roi_percentage'],
                    'action_required': 'Review pricing strategy'
                })
        
        return alerts
```

## Phase 3: API Endpoints Implementation

### 3.1 Update Flask Routes

```python
# routes/analytics.py - Enhanced version

from flask import Blueprint, request, jsonify
from models import db, Upload, ProcessedData
from supply_chain_engine import SupplyChainAnalyticsEngine
import pandas as pd
import json

analytics_bp = Blueprint('analytics', __name__)
engine = SupplyChainAnalyticsEngine()

@analytics_bp.route('/api/triangle/<org_id>', methods=['GET'])
def get_triangle_scores(org_id):
    """Get current Supply Chain Triangle scores"""
    try:
        # Get latest processed data
        latest_data = ProcessedData.query.filter_by(
            org_id=org_id
        ).order_by(ProcessedData.created_date.desc()).first()
        
        if not latest_data:
            return jsonify({
                'success': False,
                'message': 'No data available for analysis'
            }), 404
        
        # Parse processed data
        data_dict = json.loads(latest_data.processed_data)
        df = pd.DataFrame(data_dict.get('products', []))
        
        # Get financial metrics (from database or calculate)
        financial_data = {
            'working_capital_ratio': 1.5,
            'days_inventory_outstanding': 60,
            'days_sales_outstanding': 45,
            'days_payable_outstanding': 30,
            'return_on_capital_employed': 15.0
        }
        
        # Calculate triangle scores
        triangle_scores = engine.calculate_triangle_scores(df, financial_data)
        
        # Store in database
        from models import TriangleScore
        score_record = TriangleScore(
            org_id=org_id,
            service_score=triangle_scores['service_score'],
            cost_score=triangle_scores['cost_score'],
            capital_score=triangle_scores['capital_score'],
            overall_score=triangle_scores['overall_score'],
            metrics=json.dumps(triangle_scores['metrics'])
        )
        db.session.add(score_record)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'scores': triangle_scores,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@analytics_bp.route('/api/dashboard/<user_id>', methods=['GET'])
def get_dashboard_data(user_id):
    """Get comprehensive dashboard data with real analytics"""
    try:
        # Get user's organization
        from models import User
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        org_id = user.org_id
        
        # Get latest analytics
        from models import ProductAnalytics, FinancialMetrics, TriangleScore
        
        # Get product analytics
        products = ProductAnalytics.query.filter_by(org_id=org_id).all()
        
        # Get financial metrics
        financial = FinancialMetrics.query.filter_by(
            org_id=org_id
        ).order_by(FinancialMetrics.period_date.desc()).first()
        
        # Get triangle scores
        triangle = TriangleScore.query.filter_by(
            org_id=org_id
        ).order_by(TriangleScore.calculated_at.desc()).first()
        
        # Build response
        response = {
            'metrics': {
                'total_inventory_value': sum(p.current_stock * p.unit_cost for p in products),
                'total_products': len(products),
                'low_stock_count': len([p for p in products if p.stock_status == 'low_stock']),
                'out_of_stock_count': len([p for p in products if p.stock_status == 'stockout']),
                'avg_inventory_turnover': sum(p.inventory_turnover for p in products) / len(products) if products else 0,
                'monthly_burn_rate': financial.inventory_value / 30 if financial else 0,
                'working_capital_efficiency': financial.working_capital_ratio if financial else 0
            },
            'product_performance': [
                {
                    'product_id': p.sku,
                    'product_name': p.sku,  # You might want to add a product_name field
                    'current_stock': float(p.current_stock),
                    'sales_velocity': float(p.sales_velocity),
                    'days_of_stock': p.days_of_supply,
                    'inventory_turnover': float(p.inventory_turnover),
                    'roi_percentage': float(p.roi_percentage),
                    'selling_price': float(p.selling_price),
                    'cost_per_unit': float(p.unit_cost),
                    'status': p.stock_status,
                    'reorder_point': float(p.reorder_point),
                    'supplier_name': 'Default Supplier'  # Add supplier relationship
                } for p in products
            ],
            'inventory_alerts': [],  # Populate from alert_instances table
            'financial_insights': {
                'cash_tied_up': financial.inventory_value if financial else 0,
                'inventory_to_sales_ratio': 0.3,  # Calculate from data
                'days_of_cash_in_inventory': financial.cash_conversion_cycle if financial else 0,
                'high_value_products': [],  # Calculate from products
                'low_turnover_products': []  # Calculate from products
            },
            'triangle_scores': {
                'service': triangle.service_score if triangle else 0,
                'cost': triangle.cost_score if triangle else 0,
                'capital': triangle.capital_score if triangle else 0,
                'overall': triangle.overall_score if triangle else 0
            } if triangle else None
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Failed to fetch dashboard data: {str(e)}'
        }), 500

@analytics_bp.route('/api/analytics/process/<upload_id>', methods=['POST'])
def process_upload(upload_id):
    """Process uploaded file through analytics engine"""
    try:
        upload = Upload.query.get(upload_id)
        if not upload:
            return jsonify({'error': 'Upload not found'}), 404
        
        # Read the uploaded file
        import os
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], upload.filename)
        
        if upload.file_type == 'csv':
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
        
        # Run analytics
        analytics = engine.calculate_product_analytics(df)
        
        # Calculate triangle scores
        financial_data = {}  # Get from database or defaults
        triangle_scores = engine.calculate_triangle_scores(analytics, financial_data)
        
        # Generate alerts
        alerts = engine.generate_alerts(analytics, [])  # Pass alert rules
        
        # Store processed data
        processed_data = ProcessedData(
            upload_id=upload.id,
            org_id=upload.org_id,
            data_type='comprehensive_analytics',
            processed_data=json.dumps({
                'products': analytics.to_dict(orient='records'),
                'triangle_scores': triangle_scores,
                'alerts': alerts,
                'timestamp': datetime.utcnow().isoformat()
            })
        )
        db.session.add(processed_data)
        
        # Update upload status
        upload.status = 'completed'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Analytics processing completed',
            'summary': {
                'products_analyzed': len(analytics),
                'alerts_generated': len(alerts),
                'triangle_scores': triangle_scores
            }
        }), 200
        
    except Exception as e:
        upload.status = 'error'
        upload.error_message = str(e)
        db.session.commit()
        return jsonify({
            'error': f'Processing failed: {str(e)}'
        }), 500
```

## Phase 4: Frontend Integration

### 4.1 Triangle Score Component

```typescript
// src/components/TriangleScore.tsx

import React from 'react';
import { Radar } from 'recharts';

interface TriangleScoreProps {
  scores: {
    service: number;
    cost: number;
    capital: number;
    overall: number;
  };
}

export const TriangleScore: React.FC<TriangleScoreProps> = ({ scores }) => {
  const data = [
    { metric: 'Service', value: scores.service, fullMark: 100 },
    { metric: 'Cost', value: scores.cost, fullMark: 100 },
    { metric: 'Capital', value: scores.capital, fullMark: 100 }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">Supply Chain Triangle</h2>
      
      <div className="flex items-center justify-between mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold">
            <span className={getScoreColor(scores.overall)}>{scores.overall}</span>
          </div>
          <div className="text-sm text-gray-600">Overall Score</div>
        </div>
        
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-xl font-semibold text-blue-600">{scores.service}</div>
            <div className="text-xs text-gray-600">Service</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold text-green-600">{scores.cost}</div>
            <div className="text-xs text-gray-600">Cost</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold text-purple-600">{scores.capital}</div>
            <div className="text-xs text-gray-600">Capital</div>
          </div>
        </div>
      </div>
      
      <div className="h-64">
        {/* Add Recharts Radar chart here */}
        <div className="flex items-center justify-center h-full text-gray-400">
          Triangle Visualization
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>The harmonic mean ensures balanced optimization across all three dimensions.</p>
      </div>
    </div>
  );
};
```

### 4.2 Update Dashboard Components

```typescript
// Update MainDashboard.tsx to include Triangle Score

import { TriangleScore } from './TriangleScore';

// In the dashboard render:
{triangleScores && (
  <div className="mb-8">
    <TriangleScore scores={triangleScores} />
  </div>
)}
```

## Phase 5: Automated Processing Pipeline

### 5.1 Upload Processing Enhancement

```python
# Update upload_routes.py to automatically trigger analytics

@upload_bp.route('/upload', methods=['POST'])
def upload_file():
    # ... existing upload logic ...
    
    # After successful file save:
    # Trigger analytics processing
    from routes.analytics import process_upload
    
    # Process in background or queue
    try:
        result = process_upload(upload.id)
        if result.status_code == 200:
            upload.analytics_processed = True
            db.session.commit()
    except Exception as e:
        current_app.logger.error(f"Analytics processing failed: {e}")
    
    return jsonify({
        'success': True,
        'upload': upload.to_dict(),
        'analytics_triggered': True
    }), 200
```

## Implementation Timeline

### Week 1: Database & Core Engine
- [ ] Create all database tables
- [ ] Migrate existing data
- [ ] Implement enhanced analytics engine
- [ ] Test calculations with sample data

### Week 2: API Integration
- [ ] Implement all new API endpoints
- [ ] Update existing endpoints
- [ ] Add automatic processing pipeline
- [ ] Test API responses

### Week 3: Frontend Integration
- [ ] Add Triangle Score component
- [ ] Update all dashboards with real data
- [ ] Remove hardcoded values
- [ ] Implement real-time updates

### Week 4: Testing & Optimization
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Alert system testing
- [ ] Documentation update

## Success Metrics

1. **All dashboards show real calculated data** (no hardcoded values)
2. **Triangle scores update within 5 seconds** of data changes
3. **Alerts generate accurately** based on configured rules
4. **Processing time < 2 seconds** for typical CSV files
5. **API response time < 500ms** for dashboard data

This implementation plan provides a clear roadmap to transform your current application into a sophisticated supply chain analytics platform with the Triangle framework at its core.