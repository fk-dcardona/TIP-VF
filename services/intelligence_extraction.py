"""
Intelligence Extraction Service for Finkargo Data Moat
Extracts maximum value from every user interaction and transaction
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import numpy as np
from sqlalchemy import func, and_
from models import db
from models_enhanced import (
    TradeFinanceTransaction, CustomerIntelligence, MarketIntelligence,
    MarketplaceIntelligence, FeedbackCollection, CompetitorIntelligence
)
import logging

logger = logging.getLogger(__name__)


class IntelligenceExtractionService:
    """Service for extracting and aggregating market intelligence"""
    
    def __init__(self):
        self.confidence_threshold = 0.7
        self.min_data_points = 10
    
    def process_upload_intelligence(self, upload_data: Dict, org_id: str) -> Dict[str, Any]:
        """Extract intelligence from uploaded data"""
        try:
            intelligence = {
                'customer_profile': self._extract_customer_profile(upload_data, org_id),
                'market_patterns': self._extract_market_patterns(upload_data),
                'competitive_insights': self._extract_competitive_insights(upload_data),
                'risk_indicators': self._extract_risk_indicators(upload_data),
                'opportunities': self._identify_opportunities(upload_data)
            }
            
            # Store intelligence in database
            self._store_customer_intelligence(intelligence['customer_profile'], org_id)
            self._update_market_intelligence(intelligence['market_patterns'])
            
            return intelligence
            
        except Exception as e:
            logger.error(f"Error extracting intelligence: {str(e)}")
            return {}
    
    def _extract_customer_profile(self, data: Dict, org_id: str) -> Dict:
        """Extract customer behavior and preferences"""
        profile = {
            'order_patterns': self._analyze_order_patterns(data),
            'product_preferences': self._analyze_product_preferences(data),
            'seasonal_behavior': self._analyze_seasonality(data),
            'supplier_relationships': self._analyze_supplier_relationships(data),
            'financial_health': self._assess_financial_health(data)
        }
        return profile
    
    def _extract_market_patterns(self, data: Dict) -> Dict:
        """Extract market-level patterns from individual data"""
        patterns = {
            'demand_trends': self._calculate_demand_trends(data),
            'price_movements': self._analyze_price_movements(data),
            'supply_chain_efficiency': self._measure_supply_chain_efficiency(data),
            'market_volatility': self._calculate_volatility(data)
        }
        return patterns
    
    def _extract_competitive_insights(self, data: Dict) -> Dict:
        """Extract insights about competitive landscape"""
        insights = {
            'market_share_indicators': self._estimate_market_position(data),
            'pricing_competitiveness': self._analyze_pricing_position(data),
            'supplier_exclusivity': self._check_supplier_relationships(data),
            'growth_trajectory': self._calculate_growth_metrics(data)
        }
        return insights
    
    def _extract_risk_indicators(self, data: Dict) -> Dict:
        """Identify risk factors from the data"""
        risks = {
            'inventory_risk': self._assess_inventory_risk(data),
            'supplier_concentration': self._calculate_supplier_concentration(data),
            'payment_risk': self._assess_payment_patterns(data),
            'demand_volatility': self._measure_demand_stability(data)
        }
        return risks
    
    def _identify_opportunities(self, data: Dict) -> List[Dict]:
        """Identify business opportunities from data patterns"""
        opportunities = []
        
        # Check for inventory optimization opportunities
        if self._has_excess_inventory(data):
            opportunities.append({
                'type': 'inventory_optimization',
                'description': 'Reduce carrying costs by optimizing inventory levels',
                'potential_savings': self._calculate_inventory_savings(data),
                'confidence': 0.85
            })
        
        # Check for supplier diversification opportunities
        if self._needs_supplier_diversification(data):
            opportunities.append({
                'type': 'supplier_diversification',
                'description': 'Reduce supply chain risk through supplier diversification',
                'risk_reduction': self._calculate_risk_reduction(data),
                'confidence': 0.78
            })
        
        # Check for financing opportunities
        if self._has_financing_opportunity(data):
            opportunities.append({
                'type': 'trade_financing',
                'description': 'Improve cash flow with trade financing solutions',
                'cash_flow_improvement': self._calculate_cash_flow_benefit(data),
                'confidence': 0.82
            })
        
        return opportunities
    
    def aggregate_market_intelligence(self, time_period: datetime) -> None:
        """Aggregate individual transactions into market intelligence"""
        try:
            # Get all product categories and regions
            categories = db.session.query(
                TradeFinanceTransaction.product_category,
                TradeFinanceTransaction.supplier_region
            ).distinct().all()
            
            for category, region in categories:
                if not category or not region:
                    continue
                
                # Aggregate data for this category and region
                market_data = self._aggregate_category_region_data(
                    category, region, time_period
                )
                
                if market_data['data_points'] >= self.min_data_points:
                    # Create or update market intelligence record
                    self._update_market_intelligence_record(
                        category, region, time_period, market_data
                    )
                    
                    # Create marketplace intelligence if enough data
                    if market_data['confidence'] >= self.confidence_threshold:
                        self._create_marketplace_intelligence(
                            category, region, time_period, market_data
                        )
            
            db.session.commit()
            logger.info(f"Successfully aggregated market intelligence for {time_period}")
            
        except Exception as e:
            logger.error(f"Error aggregating market intelligence: {str(e)}")
            db.session.rollback()
    
    def _aggregate_category_region_data(self, category: str, region: str, 
                                      time_period: datetime) -> Dict:
        """Aggregate data for specific category and region"""
        # Get transactions for the period
        start_date = time_period.replace(day=1)
        end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        transactions = TradeFinanceTransaction.query.filter(
            and_(
                TradeFinanceTransaction.product_category == category,
                TradeFinanceTransaction.supplier_region == region,
                TradeFinanceTransaction.transaction_date >= start_date,
                TradeFinanceTransaction.transaction_date <= end_date
            )
        ).all()
        
        if not transactions:
            return {'data_points': 0}
        
        # Calculate aggregated metrics
        amounts = [t.amount_usd for t in transactions]
        lead_times = [t.cash_conversion_days for t in transactions if t.cash_conversion_days]
        risk_scores = [t.transaction_risk_score for t in transactions if t.transaction_risk_score]
        
        aggregated = {
            'data_points': len(transactions),
            'total_volume': sum(amounts),
            'average_transaction': np.mean(amounts),
            'price_volatility': np.std(amounts) / np.mean(amounts) if amounts else 0,
            'average_lead_time': np.mean(lead_times) if lead_times else None,
            'average_risk_score': np.mean(risk_scores) if risk_scores else None,
            'unique_suppliers': len(set(t.supplier_name for t in transactions)),
            'unique_importers': len(set(t.importer_org_id for t in transactions)),
            'confidence': min(len(transactions) / 100, 1.0)  # More data = higher confidence
        }
        
        return aggregated
    
    def _update_market_intelligence_record(self, category: str, region: str,
                                         time_period: datetime, data: Dict) -> None:
        """Update or create market intelligence record"""
        record = MarketIntelligence.query.filter_by(
            product_category=category,
            geographic_region=region,
            time_period=time_period.date()
        ).first()
        
        if not record:
            record = MarketIntelligence(
                product_category=category,
                geographic_region=region,
                time_period=time_period.date()
            )
            db.session.add(record)
        
        # Update with aggregated data
        record.total_market_demand = data.get('total_volume', 0)
        record.average_unit_price = data.get('average_transaction', 0)
        record.price_volatility = data.get('price_volatility', 0)
        record.total_suppliers = data.get('unique_suppliers', 0)
        record.average_lead_time = data.get('average_lead_time', 0)
        record.supply_chain_risk_score = data.get('average_risk_score', 0)
        record.data_points_count = data.get('data_points', 0)
        record.confidence_score = data.get('confidence', 0)
        record.updated_at = datetime.utcnow()
    
    def _create_marketplace_intelligence(self, category: str, region: str,
                                       time_period: datetime, data: Dict) -> None:
        """Create anonymized marketplace intelligence"""
        # Check if record exists
        record = MarketplaceIntelligence.query.filter_by(
            intelligence_type='market_overview',
            product_category=category,
            geographic_region=region,
            time_period=time_period.date()
        ).first()
        
        if not record:
            record = MarketplaceIntelligence(
                intelligence_type='market_overview',
                product_category=category,
                geographic_region=region,
                time_period=time_period.date()
            )
            db.session.add(record)
        
        # Calculate benchmarks (anonymized)
        record.total_transaction_volume = data.get('total_volume', 0)
        record.transaction_count = data.get('data_points', 0)
        record.average_order_size = data.get('average_transaction', 0)
        
        # Create performance benchmarks
        record.top_quartile_metrics = {
            'order_size': data.get('average_transaction', 0) * 1.5,
            'lead_time': max(data.get('average_lead_time', 30) * 0.75, 7),
            'risk_score': max(data.get('average_risk_score', 50) * 0.8, 20)
        }
        
        record.median_metrics = {
            'order_size': data.get('average_transaction', 0),
            'lead_time': data.get('average_lead_time', 30),
            'risk_score': data.get('average_risk_score', 50)
        }
        
        record.bottom_quartile_metrics = {
            'order_size': data.get('average_transaction', 0) * 0.5,
            'lead_time': data.get('average_lead_time', 30) * 1.25,
            'risk_score': min(data.get('average_risk_score', 50) * 1.2, 80)
        }
        
        # Market characteristics
        record.market_concentration = self._calculate_market_concentration(data)
        record.competitive_intensity = self._calculate_competitive_intensity(data)
        record.confidence_score = data.get('confidence', 0)
        record.data_points_count = data.get('data_points', 0)
        
        # Determine tier based on data depth
        if data.get('confidence', 0) > 0.9:
            record.tier_required = 'premium'
        elif data.get('confidence', 0) > 0.7:
            record.tier_required = 'basic'
        else:
            record.tier_required = 'free'
        
        record.last_updated = datetime.utcnow()
    
    def extract_competitor_intelligence(self, feedback_data: List[Dict]) -> None:
        """Extract competitor intelligence from customer feedback"""
        try:
            competitor_mentions = {}
            
            for feedback in feedback_data:
                if not feedback.get('competitor_mentions'):
                    continue
                
                for competitor in feedback['competitor_mentions']:
                    name = competitor.get('name')
                    if not name:
                        continue
                    
                    if name not in competitor_mentions:
                        competitor_mentions[name] = {
                            'strengths': [],
                            'weaknesses': [],
                            'features': [],
                            'pricing': []
                        }
                    
                    # Aggregate mentions
                    if competitor.get('strengths'):
                        competitor_mentions[name]['strengths'].extend(competitor['strengths'])
                    if competitor.get('weaknesses'):
                        competitor_mentions[name]['weaknesses'].extend(competitor['weaknesses'])
                    if competitor.get('features'):
                        competitor_mentions[name]['features'].extend(competitor['features'])
                    if competitor.get('pricing'):
                        competitor_mentions[name]['pricing'].append(competitor['pricing'])
            
            # Update competitor intelligence records
            for name, intel in competitor_mentions.items():
                self._update_competitor_record(name, intel)
            
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Error extracting competitor intelligence: {str(e)}")
            db.session.rollback()
    
    def _update_competitor_record(self, name: str, intel: Dict) -> None:
        """Update or create competitor intelligence record"""
        record = CompetitorIntelligence.query.filter_by(
            competitor_name=name
        ).first()
        
        if not record:
            record = CompetitorIntelligence(
                competitor_name=name,
                competitor_type='direct'
            )
            db.session.add(record)
        
        # Update with aggregated intelligence
        if intel['strengths']:
            record.strengths = self._aggregate_text_mentions(intel['strengths'])
        if intel['weaknesses']:
            record.weaknesses = self._aggregate_text_mentions(intel['weaknesses'])
        if intel['features']:
            record.key_features = self._aggregate_text_mentions(intel['features'])
        if intel['pricing']:
            record.pricing_model = self._analyze_pricing_mentions(intel['pricing'])
        
        record.updated_at = datetime.utcnow()
    
    # Helper methods for calculations
    
    def _analyze_order_patterns(self, data: Dict) -> Dict:
        """Analyze ordering patterns from transaction data"""
        # Implementation for order pattern analysis
        return {}
    
    def _analyze_product_preferences(self, data: Dict) -> List[str]:
        """Identify preferred product categories"""
        # Implementation for product preference analysis
        return []
    
    def _analyze_seasonality(self, data: Dict) -> Dict:
        """Detect seasonal patterns in ordering"""
        # Implementation for seasonality analysis
        return {}
    
    def _analyze_supplier_relationships(self, data: Dict) -> List[Dict]:
        """Analyze supplier relationship patterns"""
        # Implementation for supplier relationship analysis
        return []
    
    def _assess_financial_health(self, data: Dict) -> float:
        """Assess financial health based on payment patterns"""
        # Implementation for financial health assessment
        return 0.0
    
    def _calculate_demand_trends(self, data: Dict) -> Dict:
        """Calculate demand trend indicators"""
        # Implementation for demand trend calculation
        return {}
    
    def _analyze_price_movements(self, data: Dict) -> Dict:
        """Analyze price movement patterns"""
        # Implementation for price movement analysis
        return {}
    
    def _measure_supply_chain_efficiency(self, data: Dict) -> float:
        """Measure supply chain efficiency metrics"""
        # Implementation for efficiency measurement
        return 0.0
    
    def _calculate_volatility(self, data: Dict) -> float:
        """Calculate market volatility indicators"""
        # Implementation for volatility calculation
        return 0.0
    
    def _calculate_market_concentration(self, data: Dict) -> float:
        """Calculate Herfindahl index for market concentration"""
        if data.get('unique_importers', 0) == 0:
            return 1.0
        return 1.0 / data['unique_importers']
    
    def _calculate_competitive_intensity(self, data: Dict) -> float:
        """Calculate competitive intensity score"""
        suppliers = data.get('unique_suppliers', 1)
        importers = data.get('unique_importers', 1)
        return min(suppliers * importers / 100, 1.0)
    
    def _aggregate_text_mentions(self, mentions: List[str]) -> List[str]:
        """Aggregate and deduplicate text mentions"""
        # Simple aggregation - in production, use NLP for better grouping
        unique_mentions = list(set(mentions))
        return sorted(unique_mentions, key=mentions.count, reverse=True)[:10]
    
    def _analyze_pricing_mentions(self, pricing_data: List[Any]) -> Dict:
        """Analyze pricing information from mentions"""
        # Implementation for pricing analysis
        return {
            'model': 'subscription',
            'tiers': ['basic', 'premium', 'enterprise'],
            'price_range': 'competitive'
        }


# Initialize the service
intelligence_service = IntelligenceExtractionService()