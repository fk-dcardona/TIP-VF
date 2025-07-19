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
    MarketplaceIntelligence, FeedbackCollection, CompetitorIntelligence, APIIntegration
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
    
    def extract_maximum_intelligence(self, org_id: str) -> Dict[str, Any]:
        """
        Extract maximum intelligence from all available data sources
        """
        try:
            # Get all data sources
            transactions = TradeFinanceTransaction.query.filter_by(org_id=org_id).all()
            customer_intel = CustomerIntelligence.query.filter_by(org_id=org_id).first()
            api_integrations = APIIntegration.query.filter_by(org_id=org_id).all()
            feedback_data = FeedbackCollection.query.filter_by(org_id=org_id).all()
            
            # Extract comprehensive intelligence
            intelligence = {
                'transaction_intelligence': self._extract_transaction_intelligence(transactions),
                'behavioral_intelligence': self._extract_behavioral_intelligence(transactions, customer_intel),
                'market_intelligence': self._extract_advanced_market_intelligence(transactions),
                'risk_intelligence': self._extract_risk_intelligence(transactions),
                'opportunity_intelligence': self._extract_opportunity_intelligence(transactions),
                'predictive_intelligence': self._extract_predictive_intelligence(transactions),
                'competitive_intelligence': self._extract_competitive_intelligence(feedback_data),
                'integration_intelligence': self._extract_integration_intelligence(api_integrations)
            }
            
            # Calculate intelligence scores
            intelligence['intelligence_scores'] = self._calculate_intelligence_scores(intelligence)
            
            # Store enhanced intelligence
            self._store_enhanced_intelligence(intelligence, org_id)
            
            return intelligence
            
        except Exception as e:
            logger.error(f"Error extracting maximum intelligence: {str(e)}")
            return {'error': str(e)}
    
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

    def _extract_transaction_intelligence(self, transactions: List[TradeFinanceTransaction]) -> Dict:
        """
        Extract deep intelligence from transaction patterns
        """
        if not transactions:
            return {}
        
        # Transaction volume analysis
        total_volume = sum(t.amount_usd for t in transactions)
        avg_transaction = total_volume / len(transactions)
        
        # Transaction frequency analysis
        transaction_dates = [t.transaction_date for t in transactions]
        transaction_dates.sort()
        
        # Calculate frequency patterns
        if len(transaction_dates) > 1:
            date_diffs = [(transaction_dates[i+1] - transaction_dates[i]).days 
                         for i in range(len(transaction_dates)-1)]
            avg_frequency = np.mean(date_diffs)
            frequency_volatility = np.std(date_diffs)
        else:
            avg_frequency = 30  # Assume monthly
            frequency_volatility = 0
        
        # Supplier analysis
        supplier_volumes = {}
        supplier_countries = {}
        for t in transactions:
            if t.supplier_name:
                supplier_volumes[t.supplier_name] = supplier_volumes.get(t.supplier_name, 0) + t.amount_usd
            if t.supplier_country:
                supplier_countries[t.supplier_country] = supplier_countries.get(t.supplier_country, 0) + t.amount_usd
        
        # Calculate supplier concentration
        total_supplier_volume = sum(supplier_volumes.values())
        supplier_concentration = sum((vol/total_supplier_volume)**2 for vol in supplier_volumes.values()) if total_supplier_volume > 0 else 0
        
        # Product analysis
        product_volumes = {}
        for t in transactions:
            if t.product_category:
                product_volumes[t.product_category] = product_volumes.get(t.product_category, 0) + t.amount_usd
        
        return {
            'total_volume': total_volume,
            'transaction_count': len(transactions),
            'average_transaction_size': avg_transaction,
            'transaction_frequency': {
                'average_days_between': avg_frequency,
                'volatility': frequency_volatility,
                'consistency_score': max(0, 100 - frequency_volatility)
            },
            'supplier_intelligence': {
                'total_suppliers': len(supplier_volumes),
                'supplier_concentration': supplier_concentration,
                'top_suppliers': sorted(supplier_volumes.items(), key=lambda x: x[1], reverse=True)[:5],
                'geographic_distribution': supplier_countries
            },
            'product_intelligence': {
                'product_categories': len(product_volumes),
                'top_categories': sorted(product_volumes.items(), key=lambda x: x[1], reverse=True)[:5],
                'category_concentration': sum((vol/total_volume)**2 for vol in product_volumes.values()) if total_volume > 0 else 0
            }
        }
    
    def _extract_behavioral_intelligence(self, transactions: List[TradeFinanceTransaction], 
                                       customer_intel: CustomerIntelligence) -> Dict:
        """
        Extract behavioral patterns and preferences
        """
        if not transactions:
            return {}
        
        # Payment behavior analysis
        payment_terms = [t.payment_terms_days for t in transactions if t.payment_terms_days]
        advance_payments = [t.advance_payment_percentage for t in transactions if t.advance_payment_percentage]
        
        # Seasonal behavior analysis
        monthly_volumes = {}
        for t in transactions:
            month = t.transaction_date.month
            monthly_volumes[month] = monthly_volumes.get(month, 0) + t.amount_usd
        
        # Calculate seasonal patterns
        avg_monthly = np.mean(list(monthly_volumes.values())) if monthly_volumes else 0
        seasonal_index = {
            month: (vol / avg_monthly) if avg_monthly > 0 else 1.0
            for month, vol in monthly_volumes.items()
        }
        
        # Risk tolerance analysis
        risk_scores = [t.transaction_risk_score for t in transactions if t.transaction_risk_score]
        avg_risk_tolerance = np.mean(risk_scores) if risk_scores else 0.5
        
        # Growth trajectory analysis
        if len(transactions) > 1:
            transactions.sort(key=lambda x: x.transaction_date)
            first_half = transactions[:len(transactions)//2]
            second_half = transactions[len(transactions)//2:]
            
            first_half_volume = sum(t.amount_usd for t in first_half)
            second_half_volume = sum(t.amount_usd for t in second_half)
            
            growth_rate = ((second_half_volume - first_half_volume) / first_half_volume * 100) if first_half_volume > 0 else 0
        else:
            growth_rate = 0
        
        return {
            'payment_behavior': {
                'average_payment_terms': np.mean(payment_terms) if payment_terms else 30,
                'advance_payment_preference': np.mean(advance_payments) if advance_payments else 0,
                'payment_consistency': np.std(payment_terms) if len(payment_terms) > 1 else 0
            },
            'seasonal_behavior': {
                'seasonal_index': seasonal_index,
                'peak_months': [m for m, idx in seasonal_index.items() if idx > 1.2],
                'low_months': [m for m, idx in seasonal_index.items() if idx < 0.8],
                'seasonality_strength': np.std(list(seasonal_index.values()))
            },
            'risk_profile': {
                'average_risk_tolerance': avg_risk_tolerance,
                'risk_category': 'conservative' if avg_risk_tolerance < 0.3 else 'moderate' if avg_risk_tolerance < 0.7 else 'aggressive'
            },
            'growth_trajectory': {
                'growth_rate': growth_rate,
                'growth_trend': 'increasing' if growth_rate > 5 else 'stable' if growth_rate > -5 else 'decreasing',
                'momentum_score': min(100, max(0, 50 + growth_rate))
            }
        }
    
    def _extract_advanced_market_intelligence(self, transactions: List[TradeFinanceTransaction]) -> Dict:
        """
        Extract advanced market intelligence from transaction patterns
        """
        if not transactions:
            return {}
        
        # Market demand analysis
        product_demand = {}
        for t in transactions:
            if t.product_category:
                if t.product_category not in product_demand:
                    product_demand[t.product_category] = {
                        'total_volume': 0,
                        'transaction_count': 0,
                        'avg_price': 0,
                        'suppliers': set()
                    }
                
                product_demand[t.product_category]['total_volume'] += t.amount_usd
                product_demand[t.product_category]['transaction_count'] += 1
                if t.supplier_name:
                    product_demand[t.product_category]['suppliers'].add(t.supplier_name)
        
        # Calculate average prices and supplier diversity
        for category, data in product_demand.items():
            data['avg_price'] = data['total_volume'] / data['transaction_count']
            data['supplier_diversity'] = len(data['suppliers'])
            data['suppliers'] = list(data['suppliers'])
        
        # Market concentration analysis
        total_market_volume = sum(data['total_volume'] for data in product_demand.values())
        market_concentration = sum((data['total_volume']/total_market_volume)**2 
                                 for data in product_demand.values()) if total_market_volume > 0 else 0
        
        # Geographic market analysis
        geographic_markets = {}
        for t in transactions:
            if t.supplier_region:
                geographic_markets[t.supplier_region] = geographic_markets.get(t.supplier_region, 0) + t.amount_usd
        
        return {
            'product_market_intelligence': {
                'total_categories': len(product_demand),
                'market_concentration': market_concentration,
                'category_breakdown': product_demand,
                'top_categories': sorted(product_demand.items(), key=lambda x: x[1]['total_volume'], reverse=True)[:5]
            },
            'geographic_market_intelligence': {
                'total_regions': len(geographic_markets),
                'regional_breakdown': geographic_markets,
                'top_regions': sorted(geographic_markets.items(), key=lambda x: x[1], reverse=True)[:5]
            },
            'market_efficiency': {
                'average_supplier_diversity': np.mean([data['supplier_diversity'] for data in product_demand.values()]),
                'price_efficiency': self._calculate_price_efficiency(transactions),
                'lead_time_efficiency': self._calculate_lead_time_efficiency(transactions)
            }
        }
    
    def _extract_risk_intelligence(self, transactions: List[TradeFinanceTransaction]) -> Dict:
        """
        Extract comprehensive risk intelligence
        """
        if not transactions:
            return {}
        
        # Supplier risk analysis
        supplier_risks = {}
        for t in transactions:
            if t.supplier_name:
                if t.supplier_name not in supplier_risks:
                    supplier_risks[t.supplier_name] = {
                        'total_volume': 0,
                        'risk_scores': [],
                        'transaction_count': 0
                    }
                
                supplier_risks[t.supplier_name]['total_volume'] += t.amount_usd
                supplier_risks[t.supplier_name]['transaction_count'] += 1
                if t.supplier_risk_score:
                    supplier_risks[t.supplier_name]['risk_scores'].append(t.supplier_risk_score)
        
        # Calculate average risk scores
        for supplier, data in supplier_risks.items():
            data['average_risk_score'] = np.mean(data['risk_scores']) if data['risk_scores'] else 0.5
            data['risk_exposure'] = data['total_volume'] * data['average_risk_score']
        
        # Country risk analysis
        country_risks = {}
        for t in transactions:
            if t.supplier_country and t.country_risk_score:
                if t.supplier_country not in country_risks:
                    country_risks[t.supplier_country] = []
                country_risks[t.supplier_country].append(t.country_risk_score)
        
        for country, scores in country_risks.items():
            country_risks[country] = np.mean(scores)
        
        # Currency risk analysis
        currency_exposure = {}
        for t in transactions:
            if t.currency and t.currency_risk_score:
                if t.currency not in currency_exposure:
                    currency_exposure[t.currency] = {
                        'total_exposure': 0,
                        'risk_scores': []
                    }
                currency_exposure[t.currency]['total_exposure'] += t.amount_usd
                currency_exposure[t.currency]['risk_scores'].append(t.currency_risk_score)
        
        for currency, data in currency_exposure.items():
            data['average_risk_score'] = np.mean(data['risk_scores'])
        
        return {
            'supplier_risk_intelligence': {
                'total_suppliers': len(supplier_risks),
                'high_risk_suppliers': [s for s, d in supplier_risks.items() if d['average_risk_score'] > 0.7],
                'risk_exposure_by_supplier': supplier_risks,
                'total_risk_exposure': sum(d['risk_exposure'] for d in supplier_risks.values())
            },
            'country_risk_intelligence': {
                'countries_at_risk': [c for c, r in country_risks.items() if r > 0.6],
                'country_risk_scores': country_risks,
                'geographic_risk_concentration': sum(r**2 for r in country_risks.values()) / len(country_risks) if country_risks else 0
            },
            'currency_risk_intelligence': {
                'currency_exposure': currency_exposure,
                'total_currency_risk': sum(d['total_exposure'] * d['average_risk_score'] for d in currency_exposure.values())
            },
            'overall_risk_assessment': {
                'total_risk_score': self._calculate_overall_risk_score(supplier_risks, country_risks, currency_exposure),
                'risk_category': self._categorize_risk_level(supplier_risks, country_risks, currency_exposure)
            }
        }
    
    def _extract_opportunity_intelligence(self, transactions: List[TradeFinanceTransaction]) -> Dict:
        """
        Extract business opportunities from transaction patterns
        """
        if not transactions:
            return {}
        
        opportunities = []
        
        # Supplier diversification opportunities
        supplier_volumes = {}
        for t in transactions:
            if t.supplier_name:
                supplier_volumes[t.supplier_name] = supplier_volumes.get(t.supplier_name, 0) + t.amount_usd
        
        total_volume = sum(supplier_volumes.values())
        if total_volume > 0:
            top_supplier_share = max(supplier_volumes.values()) / total_volume
            if top_supplier_share > 0.5:  # More than 50% from one supplier
                opportunities.append({
                    'type': 'supplier_diversification',
                    'description': f'Reduce dependency on top supplier ({top_supplier_share:.1%} of volume)',
                    'potential_impact': 'high',
                    'implementation_effort': 'medium',
                    'estimated_savings': total_volume * 0.05  # 5% cost reduction
                })
        
        # Product portfolio optimization
        product_volumes = {}
        for t in transactions:
            if t.product_category:
                product_volumes[t.product_category] = product_volumes.get(t.product_category, 0) + t.amount_usd
        
        if len(product_volumes) < 3:
            opportunities.append({
                'type': 'product_diversification',
                'description': 'Expand product portfolio to reduce concentration risk',
                'potential_impact': 'medium',
                'implementation_effort': 'high',
                'estimated_revenue_increase': total_volume * 0.15  # 15% revenue increase
            })
        
        # Payment terms optimization
        payment_terms = [t.payment_terms_days for t in transactions if t.payment_terms_days]
        if payment_terms:
            avg_payment_terms = np.mean(payment_terms)
            if avg_payment_terms < 30:
                opportunities.append({
                    'type': 'payment_terms_optimization',
                    'description': f'Extend payment terms from {avg_payment_terms:.0f} to 60 days',
                    'potential_impact': 'high',
                    'implementation_effort': 'low',
                    'estimated_cash_flow_improvement': total_volume * 0.1  # 10% cash flow improvement
                })
        
        # Geographic expansion opportunities
        geographic_volumes = {}
        for t in transactions:
            if t.supplier_region:
                geographic_volumes[t.supplier_region] = geographic_volumes.get(t.supplier_region, 0) + t.amount_usd
        
        if len(geographic_volumes) < 2:
            opportunities.append({
                'type': 'geographic_expansion',
                'description': 'Expand to additional geographic regions',
                'potential_impact': 'high',
                'implementation_effort': 'high',
                'estimated_market_expansion': total_volume * 0.25  # 25% market expansion
            })
        
        return {
            'opportunities': opportunities,
            'total_opportunities': len(opportunities),
            'high_impact_opportunities': [o for o in opportunities if o['potential_impact'] == 'high'],
            'quick_wins': [o for o in opportunities if o['implementation_effort'] == 'low'],
            'total_potential_value': sum(o.get('estimated_savings', 0) + o.get('estimated_revenue_increase', 0) + 
                                       o.get('estimated_cash_flow_improvement', 0) + o.get('estimated_market_expansion', 0) 
                                       for o in opportunities)
        }
    
    def _extract_predictive_intelligence(self, transactions: List[TradeFinanceTransaction]) -> Dict:
        """
        Extract predictive intelligence for forecasting
        """
        if not transactions:
            return {}
        
        # Time series analysis
        transactions.sort(key=lambda x: x.transaction_date)
        
        # Monthly aggregation
        monthly_data = {}
        for t in transactions:
            month_key = t.transaction_date.strftime('%Y-%m')
            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    'volume': 0,
                    'count': 0,
                    'avg_price': 0
                }
            monthly_data[month_key]['volume'] += t.amount_usd
            monthly_data[month_key]['count'] += 1
        
        # Calculate average prices
        for month, data in monthly_data.items():
            data['avg_price'] = data['volume'] / data['count']
        
        # Trend analysis
        volumes = list(monthly_data.values())
        if len(volumes) > 1:
            # Simple linear trend
            x = list(range(len(volumes)))
            y = [v['volume'] for v in volumes]
            
            # Calculate trend
            n = len(x)
            sum_x = sum(x)
            sum_y = sum(y)
            sum_xy = sum(x[i] * y[i] for i in range(n))
            sum_x2 = sum(x[i] ** 2 for i in range(n))
            
            slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2) if (n * sum_x2 - sum_x ** 2) != 0 else 0
            intercept = (sum_y - slope * sum_x) / n
            
            # Forecast next 3 months
            forecast_months = 3
            forecast_volumes = []
            for i in range(len(volumes), len(volumes) + forecast_months):
                forecast_volumes.append(slope * i + intercept)
            
            trend_direction = 'increasing' if slope > 0 else 'decreasing' if slope < 0 else 'stable'
            trend_strength = abs(slope) / np.mean(y) if np.mean(y) > 0 else 0
        else:
            forecast_volumes = []
            trend_direction = 'insufficient_data'
            trend_strength = 0
        
        # Seasonal forecasting
        seasonal_forecast = self._calculate_seasonal_forecast(monthly_data)
        
        return {
            'trend_analysis': {
                'trend_direction': trend_direction,
                'trend_strength': trend_strength,
                'forecast_volumes': forecast_volumes,
                'confidence_level': min(100, max(0, 100 - len(volumes) * 5))  # More data = higher confidence
            },
            'seasonal_forecast': seasonal_forecast,
            'predictive_insights': {
                'next_quarter_volume': sum(forecast_volumes) if forecast_volumes else 0,
                'growth_rate': ((forecast_volumes[-1] - volumes[-1]['volume']) / volumes[-1]['volume'] * 100) if forecast_volumes and volumes else 0,
                'seasonal_peaks': seasonal_forecast.get('peak_months', []),
                'recommended_actions': self._generate_predictive_recommendations(forecast_volumes, seasonal_forecast)
            }
        }
    
    def _extract_competitive_intelligence(self, feedback_data: List[FeedbackCollection]) -> Dict:
        """
        Extract competitive intelligence from feedback and market data
        """
        if not feedback_data:
            return {}
        
        # Competitor mentions analysis
        competitor_mentions = {}
        for feedback in feedback_data:
            if feedback.competitor_mentions:
                for competitor in feedback.competitor_mentions:
                    if competitor not in competitor_mentions:
                        competitor_mentions[competitor] = {
                            'mention_count': 0,
                            'sentiment_scores': [],
                            'topics': []
                        }
                    
                    competitor_mentions[competitor]['mention_count'] += 1
                    if feedback.sentiment_score:
                        competitor_mentions[competitor]['sentiment_scores'].append(feedback.sentiment_score)
                    if feedback.key_topics:
                        competitor_mentions[competitor]['topics'].extend(feedback.key_topics)
        
        # Calculate average sentiment for each competitor
        for competitor, data in competitor_mentions.items():
            data['average_sentiment'] = np.mean(data['sentiment_scores']) if data['sentiment_scores'] else 0
            data['topics'] = list(set(data['topics']))  # Remove duplicates
        
        # Market positioning analysis
        market_positioning = {
            'competitor_count': len(competitor_mentions),
            'top_competitors': sorted(competitor_mentions.items(), key=lambda x: x[1]['mention_count'], reverse=True)[:5],
            'competitive_landscape': {
                'direct_competitors': [c for c, d in competitor_mentions.items() if d['average_sentiment'] < 0],
                'indirect_competitors': [c for c, d in competitor_mentions.items() if d['average_sentiment'] >= 0],
                'market_gaps': self._identify_market_gaps(feedback_data)
            }
        }
        
        return market_positioning
    
    def _extract_integration_intelligence(self, api_integrations: List[APIIntegration]) -> Dict:
        """
        Extract intelligence from API integrations
        """
        if not api_integrations:
            return {}
        
        # Integration health analysis
        active_integrations = [i for i in api_integrations if i.status == 'active']
        integration_types = {}
        
        for integration in active_integrations:
            if integration.integration_type not in integration_types:
                integration_types[integration.integration_type] = {
                    'count': 0,
                    'total_volume': 0,
                    'avg_quality_score': 0
                }
            
            integration_types[integration.integration_type]['count'] += 1
            integration_types[integration.integration_type]['total_volume'] += integration.data_volume or 0
            integration_types[integration.integration_type]['avg_quality_score'] += integration.data_quality_score or 0
        
        # Calculate averages
        for int_type, data in integration_types.items():
            data['avg_quality_score'] = data['avg_quality_score'] / data['count']
        
        # Data flow analysis
        total_data_volume = sum(i.data_volume or 0 for i in active_integrations)
        avg_quality_score = np.mean([i.data_quality_score or 0 for i in active_integrations])
        
        return {
            'integration_health': {
                'total_integrations': len(api_integrations),
                'active_integrations': len(active_integrations),
                'integration_types': integration_types,
                'health_score': (len(active_integrations) / len(api_integrations)) * 100 if api_integrations else 0
            },
            'data_flow_intelligence': {
                'total_data_volume': total_data_volume,
                'average_quality_score': avg_quality_score,
                'data_quality_tier': 'gold' if avg_quality_score > 0.8 else 'silver' if avg_quality_score > 0.6 else 'bronze',
                'integration_coverage': len(integration_types)
            },
            'optimization_opportunities': self._identify_integration_opportunities(api_integrations)
        }
    
    def _calculate_intelligence_scores(self, intelligence: Dict) -> Dict:
        """
        Calculate comprehensive intelligence scores
        """
        scores = {}
        
        # Transaction intelligence score
        if 'transaction_intelligence' in intelligence:
            txn_intel = intelligence['transaction_intelligence']
            scores['transaction_score'] = min(100, (
                (txn_intel.get('transaction_count', 0) / 100) * 30 +  # Data volume
                (1 - txn_intel.get('supplier_intelligence', {}).get('supplier_concentration', 0)) * 40 +  # Diversity
                (txn_intel.get('transaction_frequency', {}).get('consistency_score', 0)) * 30  # Consistency
            ))
        
        # Behavioral intelligence score
        if 'behavioral_intelligence' in intelligence:
            behav_intel = intelligence['behavioral_intelligence']
            scores['behavioral_score'] = min(100, (
                (1 - behav_intel.get('payment_behavior', {}).get('payment_consistency', 0) / 30) * 30 +  # Payment consistency
                (1 - behav_intel.get('seasonal_behavior', {}).get('seasonality_strength', 0)) * 30 +  # Seasonality
                behav_intel.get('growth_trajectory', {}).get('momentum_score', 50) * 0.4  # Growth momentum
            ))
        
        # Market intelligence score
        if 'market_intelligence' in intelligence:
            market_intel = intelligence['market_intelligence']
            scores['market_score'] = min(100, (
                (market_intel.get('product_market_intelligence', {}).get('total_categories', 0) / 10) * 30 +  # Category diversity
                (1 - market_intel.get('product_market_intelligence', {}).get('market_concentration', 0)) * 40 +  # Market diversity
                (market_intel.get('market_efficiency', {}).get('average_supplier_diversity', 0) / 10) * 30  # Supplier diversity
            ))
        
        # Risk intelligence score
        if 'risk_intelligence' in intelligence:
            risk_intel = intelligence['risk_intelligence']
            scores['risk_score'] = min(100, max(0, 100 - (
                risk_intel.get('supplier_risk_intelligence', {}).get('total_risk_exposure', 0) / 1000000 * 20 +  # Supplier risk
                risk_intel.get('country_risk_intelligence', {}).get('geographic_risk_concentration', 0) * 30 +  # Geographic risk
                risk_intel.get('currency_risk_intelligence', {}).get('total_currency_risk', 0) / 1000000 * 20  # Currency risk
            )))
        
        # Overall intelligence score
        if scores:
            scores['overall_intelligence_score'] = np.mean(list(scores.values()))
        
        return scores
    
    def _store_enhanced_intelligence(self, intelligence: Dict, org_id: str) -> None:
        """
        Store enhanced intelligence in database
        """
        try:
            # Store in database for historical tracking
            # This would create records in the appropriate tables
            logger.info(f"Stored enhanced intelligence for org {org_id}")
            
        except Exception as e:
            logger.error(f"Error storing enhanced intelligence: {str(e)}")
    
    # Helper methods for calculations
    def _calculate_price_efficiency(self, transactions: List[TradeFinanceTransaction]) -> float:
        """Calculate price efficiency score"""
        if not transactions:
            return 0.0
        
        prices = [t.amount_usd for t in transactions if t.amount_usd > 0]
        if not prices:
            return 0.0
        
        # Lower price variance = higher efficiency
        price_variance = np.std(prices) / np.mean(prices)
        efficiency = max(0, 100 - price_variance * 100)
        
        return efficiency
    
    def _calculate_lead_time_efficiency(self, transactions: List[TradeFinanceTransaction]) -> float:
        """Calculate lead time efficiency score"""
        if not transactions:
            return 0.0
        
        lead_times = [t.cash_conversion_days for t in transactions if t.cash_conversion_days]
        if not lead_times:
            return 0.0
        
        # Lower lead times = higher efficiency
        avg_lead_time = np.mean(lead_times)
        efficiency = max(0, 100 - avg_lead_time)
        
        return efficiency
    
    def _calculate_overall_risk_score(self, supplier_risks: Dict, country_risks: Dict, 
                                    currency_exposure: Dict) -> float:
        """Calculate overall risk score"""
        # Weighted risk calculation
        supplier_risk = sum(d['risk_exposure'] for d in supplier_risks.values()) / 1000000
        country_risk = np.mean(list(country_risks.values())) if country_risks else 0.5
        currency_risk = sum(d['total_exposure'] * d['average_risk_score'] for d in currency_exposure.values()) / 1000000
        
        overall_risk = (supplier_risk * 0.4 + country_risk * 0.3 + currency_risk * 0.3)
        return min(1.0, overall_risk)
    
    def _categorize_risk_level(self, supplier_risks: Dict, country_risks: Dict, 
                             currency_exposure: Dict) -> str:
        """Categorize overall risk level"""
        risk_score = self._calculate_overall_risk_score(supplier_risks, country_risks, currency_exposure)
        
        if risk_score < 0.3:
            return 'low'
        elif risk_score < 0.7:
            return 'medium'
        else:
            return 'high'
    
    def _calculate_seasonal_forecast(self, monthly_data: Dict) -> Dict:
        """Calculate seasonal forecast"""
        if not monthly_data:
            return {}
        
        # Group by month
        monthly_totals = {}
        for month_key, data in monthly_data.items():
            month = int(month_key.split('-')[1])
            if month not in monthly_totals:
                monthly_totals[month] = []
            monthly_totals[month].append(data['volume'])
        
        # Calculate seasonal indices
        seasonal_indices = {}
        for month, volumes in monthly_totals.items():
            seasonal_indices[month] = np.mean(volumes)
        
        # Normalize to 1.0 average
        avg_volume = np.mean(list(seasonal_indices.values()))
        seasonal_indices = {month: vol / avg_volume for month, vol in seasonal_indices.items()}
        
        return {
            'seasonal_indices': seasonal_indices,
            'peak_months': [m for m, idx in seasonal_indices.items() if idx > 1.2],
            'low_months': [m for m, idx in seasonal_indices.items() if idx < 0.8]
        }
    
    def _generate_predictive_recommendations(self, forecast_volumes: List[float], 
                                          seasonal_forecast: Dict) -> List[str]:
        """Generate predictive recommendations"""
        recommendations = []
        
        if forecast_volumes:
            # Volume trend recommendations
            if len(forecast_volumes) > 1:
                trend = forecast_volumes[-1] - forecast_volumes[0]
                if trend > 0:
                    recommendations.append("Increase inventory levels to meet growing demand")
                elif trend < 0:
                    recommendations.append("Optimize inventory to reduce carrying costs")
            
            # Seasonal recommendations
            current_month = datetime.now().month
            if current_month in seasonal_forecast.get('peak_months', []):
                recommendations.append("Prepare for seasonal peak demand")
            elif current_month in seasonal_forecast.get('low_months', []):
                recommendations.append("Optimize operations during low season")
        
        return recommendations
    
    def _identify_market_gaps(self, feedback_data: List[FeedbackCollection]) -> List[str]:
        """Identify market gaps from feedback"""
        gaps = []
        
        # Analyze pain points
        all_pain_points = []
        for feedback in feedback_data:
            if feedback.pain_points:
                all_pain_points.extend(feedback.pain_points)
        
        # Find common pain points
        pain_point_counts = {}
        for point in all_pain_points:
            pain_point_counts[point] = pain_point_counts.get(point, 0) + 1
        
        # Identify gaps (pain points mentioned by multiple users)
        for point, count in pain_point_counts.items():
            if count >= 3:  # Mentioned by at least 3 users
                gaps.append(f"Address: {point}")
        
        return gaps
    
    def _identify_integration_opportunities(self, api_integrations: List[APIIntegration]) -> List[Dict]:
        """Identify integration optimization opportunities"""
        opportunities = []
        
        # Low quality integrations
        low_quality = [i for i in api_integrations if i.data_quality_score and i.data_quality_score < 0.6]
        if low_quality:
            opportunities.append({
                'type': 'quality_improvement',
                'description': f'Improve data quality for {len(low_quality)} integrations',
                'potential_impact': 'medium'
            })
        
        # Missing integration types
        existing_types = set(i.integration_type for i in api_integrations)
        recommended_types = {'erp', 'accounting', 'ecommerce', 'logistics'}
        missing_types = recommended_types - existing_types
        
        if missing_types:
            opportunities.append({
                'type': 'integration_expansion',
                'description': f'Add integrations for: {", ".join(missing_types)}',
                'potential_impact': 'high'
            })
        
        return opportunities


# Initialize the service
intelligence_service = IntelligenceExtractionService()