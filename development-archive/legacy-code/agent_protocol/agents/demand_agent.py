"""Demand Forecasting Agent Implementation."""

from typing import Dict, Any, List, Optional, Tuple
import logging
from datetime import datetime, timedelta
import numpy as np
from decimal import Decimal

from ..core.base_agent import BaseAgent
from ..core.agent_types import AgentType
from ..core.agent_context import AgentContext
from ..core.agent_result import AgentResult
from ..tools.database_tools import DatabaseQueryTool, TriangleAnalyticsTool
from ..tools.analysis_tools import DataAnalysisTool, MetricsCalculatorTool, InsightGeneratorTool
from ..prompts.prompt_manager import PromptManager


class DemandForecasterAgent(BaseAgent):
    """
    Agent specialized in demand forecasting and predictive analytics.
    
    Responsibilities:
    - Analyze historical demand patterns
    - Identify trends and seasonality
    - Generate accurate demand forecasts
    - Quantify forecast uncertainty
    - Recommend inventory adjustments
    - Detect demand anomalies
    """
    
    def __init__(self, agent_id: str, agent_type, name: str, description: str, config: Dict[str, Any]):
        super().__init__(
            agent_id=agent_id,
            agent_type=AgentType.DEMAND_FORECASTER,
            name=name,
            description=description,
            config=config
        )
        
        # Agent-specific configuration
        self.forecast_horizon = config.get('forecast_horizon', 30)  # days
        self.confidence_level = config.get('confidence_level', 0.95)
        self.min_data_points = config.get('min_data_points', 30)
        self.seasonality_detection = config.get('seasonality_detection', True)
        self.anomaly_sensitivity = config.get('anomaly_sensitivity', 2.0)  # std devs
        
        # Forecast method preferences (for cost optimization)
        self.preferred_methods = config.get('preferred_methods', [
            'moving_average',  # Low cost, fast
            'exponential_smoothing',  # Medium cost
            'arima',  # Higher cost, better accuracy
            'neural_network'  # Highest cost, best for complex patterns
        ])
        
        # Initialize prompt manager
        self.prompt_manager = PromptManager()
    
    def _initialize_tools(self):
        """Initialize demand forecasting tools."""
        # Database tools
        self.register_tool(DatabaseQueryTool())
        self.register_tool(TriangleAnalyticsTool())
        
        # Analysis tools
        self.register_tool(DataAnalysisTool())
        self.register_tool(MetricsCalculatorTool())
        self.register_tool(InsightGeneratorTool())
    
    def get_system_prompt(self) -> str:
        """Get demand forecasting agent system prompt."""
        tools = self.get_tool_descriptions()
        return self.prompt_manager.get_system_prompt(
            agent_type=self.agent_type.value,
            agent_name=self.name,
            tools=tools,
            context={
                'org_id': self.context.org_id if self.context else None,
                'forecast_horizon': self.forecast_horizon,
                'confidence_level': self.confidence_level,
                'methods': self.preferred_methods
            }
        )
    
    def _execute_core_logic(self, context: AgentContext) -> AgentResult:
        """Execute demand forecasting logic."""
        try:
            # Extract action from input
            action = context.input_data.get('action', 'forecast')
            
            if action == 'forecast':
                return self._generate_forecast(context)
            elif action == 'analyze_patterns':
                return self._analyze_demand_patterns(context)
            elif action == 'detect_seasonality':
                return self._detect_seasonality(context)
            elif action == 'anomaly_detection':
                return self._detect_demand_anomalies(context)
            elif action == 'accuracy_assessment':
                return self._assess_forecast_accuracy(context)
            elif action == 'optimize_forecast':
                return self._optimize_forecast_method(context)
            else:
                return AgentResult(
                    success=False,
                    message=f"Unknown action: {action}",
                    error_type="InvalidAction"
                )
                
        except Exception as e:
            self.logger.error(f"Demand forecasting failed: {str(e)}", exc_info=True)
            return AgentResult(
                success=False,
                message=f"Forecasting failed: {str(e)}",
                error_type=type(e).__name__
            )
    
    def _generate_forecast(self, context: AgentContext) -> AgentResult:
        """Generate demand forecast for products."""
        product_ids = context.input_data.get('product_ids', [])
        horizon = context.input_data.get('horizon', self.forecast_horizon)
        method = context.input_data.get('method', 'auto')  # auto selects best method
        
        context.add_reasoning_step(f"Generating {horizon}-day forecast for {len(product_ids) if product_ids else 'all'} products")
        
        # Query historical demand data
        context.add_reasoning_step("Retrieving historical demand data")
        
        demand_data = self._get_historical_demand(context, product_ids)
        
        if not demand_data:
            return AgentResult(
                success=False,
                message="No historical demand data available",
                error_type="InsufficientData"
            )
        
        context.add_evidence("historical_data", {
            "products": len(demand_data),
            "data_points": sum(len(d['history']) for d in demand_data.values())
        }, 0.95)
        
        # Generate forecasts for each product
        forecasts = {}
        overall_confidence = 0
        
        for product_id, data in demand_data.items():
            context.add_reasoning_step(f"Forecasting demand for product: {product_id}")
            
            # Check data sufficiency
            if len(data['history']) < self.min_data_points:
                context.add_reasoning_step(f"Insufficient data for {product_id} ({len(data['history'])} points)")
                continue
            
            # Detect patterns
            patterns = self._analyze_patterns(data['history'])
            context.add_evidence(f"patterns_{product_id}", patterns, 0.85)
            
            # Select forecasting method based on patterns and cost optimization
            selected_method = self._select_forecast_method(patterns, method)
            context.add_reasoning_step(f"Selected {selected_method} method for {product_id}")
            
            # Generate forecast
            forecast_result = self._apply_forecast_method(
                data['history'], 
                selected_method, 
                horizon
            )
            
            # Calculate confidence intervals
            confidence_intervals = self._calculate_confidence_intervals(
                forecast_result['forecast'],
                forecast_result['error'],
                self.confidence_level
            )
            
            forecasts[product_id] = {
                'method': selected_method,
                'forecast': forecast_result['forecast'],
                'confidence_intervals': confidence_intervals,
                'accuracy_metrics': forecast_result['metrics'],
                'patterns': patterns,
                'confidence_score': forecast_result['confidence']
            }
            
            overall_confidence += forecast_result['confidence']
        
        # Calculate overall metrics
        avg_confidence = overall_confidence / len(forecasts) if forecasts else 0
        
        # Generate insights
        insights_result = self.call_tool("insight_generator", {
            "insight_type": "demand",
            "data": {
                "forecast_accuracy": avg_confidence,
                "products_forecasted": len(forecasts),
                "horizon": horizon
            },
            "role": "operations"
        })
        
        result = AgentResult(
            success=True,
            message=f"Generated {horizon}-day demand forecast for {len(forecasts)} products",
            data={
                "forecasts": forecasts,
                "summary": {
                    "products_forecasted": len(forecasts),
                    "forecast_horizon": horizon,
                    "average_confidence": round(avg_confidence, 3),
                    "methods_used": list(set(f['method'] for f in forecasts.values()))
                },
                "insights": insights_result.data.get('insights', []) if insights_result.success else []
            },
            confidence=avg_confidence
        )
        
        # Add recommendations
        for product_id, forecast in forecasts.items():
            if forecast['patterns'].get('trend') == 'increasing':
                result.add_recommendation(
                    title=f"Increase inventory for {product_id}",
                    description=f"Demand trending up {forecast['patterns']['trend_strength']:.1%}",
                    impact="high",
                    metadata={'product_id': product_id}
                )
            elif any(f['value'] < 0 for f in forecast['forecast']):
                result.add_action(
                    action_type="review",
                    description=f"Review negative forecast for {product_id}",
                    priority="high"
                )
        
        return result
    
    def _analyze_demand_patterns(self, context: AgentContext) -> AgentResult:
        """Analyze demand patterns in detail."""
        product_id = context.input_data.get('product_id')
        
        context.add_reasoning_step(f"Analyzing demand patterns for {product_id}")
        
        # Get historical data
        demand_data = self._get_historical_demand(context, [product_id] if product_id else [])
        
        if not demand_data:
            return AgentResult(
                success=False,
                message="No demand data available",
                error_type="NoData"
            )
        
        pattern_analysis = {}
        
        for pid, data in demand_data.items():
            history = data['history']
            
            # Trend analysis
            trend_result = self.call_tool("data_analysis", {
                "analysis_type": "trend",
                "data": history
            })
            
            # Seasonality detection
            seasonality = self._detect_seasonal_patterns(history)
            
            # Volatility analysis
            volatility = self._calculate_demand_volatility(history)
            
            # Correlation with external factors
            correlations = self._analyze_external_correlations(history, context)
            
            pattern_analysis[pid] = {
                'trend': trend_result.data if trend_result.success else None,
                'seasonality': seasonality,
                'volatility': volatility,
                'correlations': correlations,
                'demand_type': self._classify_demand_pattern(
                    trend_result.data if trend_result.success else {},
                    seasonality,
                    volatility
                )
            }
        
        result = AgentResult(
            success=True,
            message=f"Pattern analysis completed for {len(pattern_analysis)} products",
            data={
                "pattern_analysis": pattern_analysis,
                "summary": {
                    "stable_products": len([p for p in pattern_analysis.values() 
                                          if p['demand_type'] == 'stable']),
                    "seasonal_products": len([p for p in pattern_analysis.values() 
                                            if p['seasonality']['is_seasonal']]),
                    "volatile_products": len([p for p in pattern_analysis.values() 
                                           if p['volatility']['level'] == 'high'])
                }
            },
            confidence=0.87
        )
        
        # Add insights
        for pid, analysis in pattern_analysis.items():
            if analysis['volatility']['level'] == 'high':
                result.add_insight(
                    category="demand_volatility",
                    insight=f"High demand volatility detected for {pid}",
                    severity="warning",
                    data={'cv': analysis['volatility']['coefficient_of_variation']}
                )
        
        return result
    
    def _detect_seasonality(self, context: AgentContext) -> AgentResult:
        """Detect seasonal patterns in demand."""
        product_ids = context.input_data.get('product_ids', [])
        
        context.add_reasoning_step("Detecting seasonal patterns in demand")
        
        demand_data = self._get_historical_demand(context, product_ids)
        
        seasonality_results = {}
        
        for product_id, data in demand_data.items():
            history = data['history']
            
            if len(history) < 365:  # Need at least 1 year of data
                seasonality_results[product_id] = {
                    'is_seasonal': False,
                    'reason': 'Insufficient data (< 1 year)'
                }
                continue
            
            # Detect seasonal patterns
            seasonal_analysis = self._detect_seasonal_patterns(history)
            seasonality_results[product_id] = seasonal_analysis
            
            context.add_evidence(f"seasonality_{product_id}", seasonal_analysis, 0.8)
        
        result = AgentResult(
            success=True,
            message=f"Seasonality detection completed for {len(seasonality_results)} products",
            data={
                "seasonality_analysis": seasonality_results,
                "seasonal_products": [
                    pid for pid, s in seasonality_results.items() 
                    if s.get('is_seasonal', False)
                ]
            },
            confidence=0.85
        )
        
        # Add recommendations for seasonal products
        for pid, seasonal in seasonality_results.items():
            if seasonal.get('is_seasonal'):
                result.add_recommendation(
                    title=f"Seasonal inventory planning for {pid}",
                    description=f"Peak season: {seasonal.get('peak_season', 'Unknown')}",
                    impact="high",
                    metadata={'product_id': pid, 'seasonality': seasonal}
                )
        
        return result
    
    def _detect_demand_anomalies(self, context: AgentContext) -> AgentResult:
        """Detect anomalies in demand patterns."""
        product_ids = context.input_data.get('product_ids', [])
        lookback_days = context.input_data.get('lookback_days', 30)
        
        context.add_reasoning_step(f"Detecting demand anomalies (last {lookback_days} days)")
        
        demand_data = self._get_historical_demand(context, product_ids)
        
        all_anomalies = {}
        total_anomalies = 0
        
        for product_id, data in demand_data.items():
            history = data['history'][-lookback_days:]  # Recent data
            
            # Use analysis tool for anomaly detection
            anomaly_result = self.call_tool("data_analysis", {
                "analysis_type": "anomaly",
                "data": history
            })
            
            if anomaly_result.success:
                anomalies = anomaly_result.data.get('anomalies', [])
                if anomalies:
                    all_anomalies[product_id] = {
                        'anomalies': anomalies,
                        'anomaly_rate': anomaly_result.data.get('anomaly_rate', 0),
                        'severity': self._assess_anomaly_severity(anomalies)
                    }
                    total_anomalies += len(anomalies)
                    
                    context.add_evidence(f"anomalies_{product_id}", anomalies, 0.9)
        
        result = AgentResult(
            success=True,
            message=f"Detected {total_anomalies} anomalies across {len(all_anomalies)} products",
            data={
                "anomaly_detection": all_anomalies,
                "summary": {
                    "total_anomalies": total_anomalies,
                    "affected_products": len(all_anomalies),
                    "high_severity": len([a for a in all_anomalies.values() 
                                        if a['severity'] == 'high'])
                }
            },
            confidence=0.88
        )
        
        # Add actions for high-severity anomalies
        for product_id, anomaly_data in all_anomalies.items():
            if anomaly_data['severity'] == 'high':
                result.add_action(
                    action_type="investigate",
                    description=f"Investigate demand anomaly for {product_id}",
                    priority="high",
                    metadata={'anomaly_count': len(anomaly_data['anomalies'])}
                )
        
        return result
    
    def _assess_forecast_accuracy(self, context: AgentContext) -> AgentResult:
        """Assess historical forecast accuracy."""
        lookback_periods = context.input_data.get('lookback_periods', 6)
        
        context.add_reasoning_step(f"Assessing forecast accuracy (last {lookback_periods} periods)")
        
        # Get historical forecasts and actuals
        accuracy_data = self._get_forecast_accuracy_data(lookback_periods)
        
        # Calculate accuracy metrics
        accuracy_results = {}
        
        for period in accuracy_data:
            # Calculate forecast accuracy
            accuracy_result = self.call_tool("metrics_calculator", {
                "metric_type": "forecast_accuracy",
                "data": {
                    "actual_values": period['actuals'],
                    "forecast_values": period['forecasts']
                }
            })
            
            if accuracy_result.success:
                accuracy_results[period['period']] = accuracy_result.data
        
        # Calculate overall metrics
        all_actuals = []
        all_forecasts = []
        for period in accuracy_data:
            all_actuals.extend(period['actuals'])
            all_forecasts.extend(period['forecasts'])
        
        overall_accuracy = self.call_tool("metrics_calculator", {
            "metric_type": "forecast_accuracy",
            "data": {
                "actual_values": all_actuals,
                "forecast_values": all_forecasts
            }
        })
        
        result = AgentResult(
            success=True,
            message=f"Forecast accuracy assessment completed",
            data={
                "period_accuracy": accuracy_results,
                "overall_accuracy": overall_accuracy.data if overall_accuracy.success else None,
                "improvement_trend": self._calculate_accuracy_trend(accuracy_results)
            },
            confidence=0.9
        )
        
        # Add insights
        if overall_accuracy.success:
            accuracy = overall_accuracy.data.get('forecast_accuracy', 0)
            if accuracy < 80:
                result.add_recommendation(
                    title="Improve forecast models",
                    description=f"Current accuracy {accuracy:.1f}% is below target",
                    impact="high"
                )
        
        return result
    
    def _optimize_forecast_method(self, context: AgentContext) -> AgentResult:
        """Optimize forecast method selection for cost and accuracy."""
        product_ids = context.input_data.get('product_ids', [])
        optimization_goal = context.input_data.get('goal', 'balanced')  # balanced, accuracy, cost
        
        context.add_reasoning_step(f"Optimizing forecast methods for {optimization_goal} goal")
        
        demand_data = self._get_historical_demand(context, product_ids)
        
        optimization_results = {}
        
        for product_id, data in demand_data.items():
            history = data['history']
            
            # Test different methods
            method_performance = {}
            
            for method in self.preferred_methods:
                # Skip expensive methods if optimizing for cost
                if optimization_goal == 'cost' and method in ['arima', 'neural_network']:
                    continue
                
                # Test method performance
                test_result = self._test_forecast_method(history, method)
                
                # Calculate cost score (simplified)
                cost_scores = {
                    'moving_average': 0.1,
                    'exponential_smoothing': 0.3,
                    'arima': 0.7,
                    'neural_network': 1.0
                }
                
                method_performance[method] = {
                    'accuracy': test_result['accuracy'],
                    'mape': test_result['mape'],
                    'cost_score': cost_scores.get(method, 0.5),
                    'execution_time': test_result['execution_time']
                }
            
            # Select optimal method
            optimal_method = self._select_optimal_method(
                method_performance, 
                optimization_goal
            )
            
            optimization_results[product_id] = {
                'recommended_method': optimal_method,
                'method_comparison': method_performance,
                'expected_improvement': self._calculate_expected_improvement(
                    method_performance,
                    optimal_method,
                    data.get('current_method', 'moving_average')
                )
            }
        
        result = AgentResult(
            success=True,
            message=f"Forecast method optimization completed for {len(optimization_results)} products",
            data={
                "optimization_results": optimization_results,
                "summary": {
                    'products_optimized': len(optimization_results),
                    'optimization_goal': optimization_goal,
                    'potential_accuracy_gain': self._calculate_avg_improvement(optimization_results),
                    'potential_cost_saving': self._calculate_cost_saving(optimization_results)
                }
            },
            confidence=0.85
        )
        
        # Add recommendations
        for product_id, opt in optimization_results.items():
            if opt['expected_improvement']['accuracy_gain'] > 0.05:
                result.add_recommendation(
                    title=f"Switch to {opt['recommended_method']} for {product_id}",
                    description=f"Expected {opt['expected_improvement']['accuracy_gain']:.1%} accuracy improvement",
                    impact="medium"
                )
        
        return result
    
    # Helper methods
    
    def _get_historical_demand(self, context: AgentContext, 
                               product_ids: List[str]) -> Dict[str, Dict]:
        """Retrieve historical demand data."""
        # This would query actual database
        # For now, generating mock data
        demand_data = {}
        
        if not product_ids:
            product_ids = [f"PROD{i:03d}" for i in range(1, 6)]
        
        for product_id in product_ids:
            # Generate mock historical data
            history = self._generate_mock_demand_history(product_id)
            demand_data[product_id] = {
                'history': history,
                'current_method': 'moving_average'
            }
        
        return demand_data
    
    def _generate_mock_demand_history(self, product_id: str) -> List[Dict]:
        """Generate mock demand history for testing."""
        import random
        import math
        
        # Base demand
        base_demand = random.randint(50, 200)
        
        # Generate 365 days of history
        history = []
        for day in range(365):
            # Add trend
            trend = day * 0.1
            
            # Add seasonality (quarterly pattern)
            seasonality = 20 * math.sin(2 * math.pi * day / 90)
            
            # Add noise
            noise = random.gauss(0, 10)
            
            # Calculate demand
            demand = max(0, base_demand + trend + seasonality + noise)
            
            # Add occasional spikes (promotions, etc.)
            if random.random() < 0.05:
                demand *= random.uniform(1.5, 2.5)
            
            history.append({
                'timestamp': (datetime.now() - timedelta(days=365-day)).isoformat(),
                'value': int(demand)
            })
        
        return history
    
    def _analyze_patterns(self, history: List[Dict]) -> Dict[str, Any]:
        """Analyze demand patterns."""
        values = [h['value'] for h in history]
        
        # Calculate basic statistics
        mean = np.mean(values)
        std = np.std(values)
        cv = std / mean if mean > 0 else 0
        
        # Detect trend
        x = np.arange(len(values))
        slope, intercept = np.polyfit(x, values, 1)
        trend_strength = slope / mean if mean > 0 else 0
        
        return {
            'mean': mean,
            'std': std,
            'cv': cv,
            'trend': 'increasing' if slope > 0 else 'decreasing',
            'trend_strength': trend_strength,
            'volatility': 'high' if cv > 0.5 else 'medium' if cv > 0.2 else 'low'
        }
    
    def _select_forecast_method(self, patterns: Dict, requested_method: str) -> str:
        """Select appropriate forecast method based on patterns."""
        if requested_method != 'auto':
            return requested_method
        
        # Cost-optimized method selection
        cv = patterns.get('cv', 0)
        trend_strength = abs(patterns.get('trend_strength', 0))
        
        if cv < 0.2 and trend_strength < 0.01:
            # Stable demand - use simple method
            return 'moving_average'
        elif cv < 0.5 and trend_strength < 0.05:
            # Moderate volatility - use exponential smoothing
            return 'exponential_smoothing'
        elif cv < 0.8:
            # High volatility - use ARIMA if cost allows
            return 'arima'
        else:
            # Very high volatility - may need neural network
            return 'neural_network'
    
    def _apply_forecast_method(self, history: List[Dict], method: str, 
                              horizon: int) -> Dict[str, Any]:
        """Apply selected forecast method."""
        values = [h['value'] for h in history]
        
        if method == 'moving_average':
            return self._moving_average_forecast(values, horizon)
        elif method == 'exponential_smoothing':
            return self._exponential_smoothing_forecast(values, horizon)
        elif method == 'arima':
            return self._arima_forecast(values, horizon)
        elif method == 'neural_network':
            return self._neural_network_forecast(values, horizon)
        else:
            # Default to moving average
            return self._moving_average_forecast(values, horizon)
    
    def _moving_average_forecast(self, values: List[float], 
                                 horizon: int) -> Dict[str, Any]:
        """Simple moving average forecast."""
        window = min(7, len(values) // 4)
        ma = np.convolve(values, np.ones(window)/window, mode='valid')
        
        # Use last MA value as forecast
        forecast_value = ma[-1] if len(ma) > 0 else values[-1]
        
        # Simple linear extrapolation for multi-step
        trend = (values[-1] - values[-7]) / 7 if len(values) >= 7 else 0
        
        forecast = []
        for i in range(horizon):
            forecast.append({
                'period': i + 1,
                'value': forecast_value + trend * i,
                'timestamp': (datetime.now() + timedelta(days=i+1)).isoformat()
            })
        
        # Calculate error based on historical performance
        error = np.std(values) * 0.5  # Simplified error
        
        return {
            'forecast': forecast,
            'error': error,
            'confidence': 0.7,
            'metrics': {
                'method': 'moving_average',
                'window': window,
                'trend': trend
            }
        }
    
    def _exponential_smoothing_forecast(self, values: List[float], 
                                       horizon: int) -> Dict[str, Any]:
        """Exponential smoothing forecast."""
        alpha = 0.3  # Smoothing parameter
        
        # Initialize
        s = [values[0]]
        
        # Apply exponential smoothing
        for i in range(1, len(values)):
            s.append(alpha * values[i] + (1 - alpha) * s[-1])
        
        # Forecast
        forecast_base = s[-1]
        trend = (s[-1] - s[-7]) / 7 if len(s) >= 7 else 0
        
        forecast = []
        for i in range(horizon):
            forecast.append({
                'period': i + 1,
                'value': forecast_base + trend * i,
                'timestamp': (datetime.now() + timedelta(days=i+1)).isoformat()
            })
        
        error = np.std(values) * 0.4  # Better than MA
        
        return {
            'forecast': forecast,
            'error': error,
            'confidence': 0.8,
            'metrics': {
                'method': 'exponential_smoothing',
                'alpha': alpha,
                'trend': trend
            }
        }
    
    def _arima_forecast(self, values: List[float], horizon: int) -> Dict[str, Any]:
        """ARIMA forecast (simplified simulation)."""
        # This would use statsmodels ARIMA in production
        # For now, simulating with better accuracy
        
        # Use exponential smoothing as base
        es_result = self._exponential_smoothing_forecast(values, horizon)
        
        # Improve forecast with seasonal adjustment
        seasonal_period = 7  # Weekly pattern
        if len(values) >= seasonal_period * 2:
            seasonal_factors = []
            for i in range(seasonal_period):
                day_values = values[i::seasonal_period]
                seasonal_factors.append(np.mean(day_values) / np.mean(values))
            
            # Apply seasonal factors
            for i, f in enumerate(es_result['forecast']):
                seasonal_idx = i % seasonal_period
                f['value'] *= seasonal_factors[seasonal_idx]
        
        return {
            'forecast': es_result['forecast'],
            'error': es_result['error'] * 0.7,  # More accurate
            'confidence': 0.85,
            'metrics': {
                'method': 'arima',
                'order': '(1,1,1)',  # Simulated
                'seasonal': True
            }
        }
    
    def _neural_network_forecast(self, values: List[float], 
                                horizon: int) -> Dict[str, Any]:
        """Neural network forecast (simplified simulation)."""
        # This would use TensorFlow/PyTorch in production
        # For now, simulating with best accuracy
        
        # Use ARIMA as base
        arima_result = self._arima_forecast(values, horizon)
        
        # Simulate non-linear pattern capture
        for i, f in enumerate(arima_result['forecast']):
            # Add non-linear adjustment
            f['value'] *= (1 + 0.05 * np.sin(i * 0.5))
        
        return {
            'forecast': arima_result['forecast'],
            'error': arima_result['error'] * 0.6,  # Most accurate
            'confidence': 0.9,
            'metrics': {
                'method': 'neural_network',
                'architecture': 'LSTM',  # Simulated
                'layers': 3
            }
        }
    
    def _calculate_confidence_intervals(self, forecast: List[Dict], 
                                       error: float, level: float) -> List[Dict]:
        """Calculate confidence intervals for forecast."""
        # Z-score for confidence level
        z_scores = {0.90: 1.645, 0.95: 1.96, 0.99: 2.576}
        z = z_scores.get(level, 1.96)
        
        intervals = []
        for i, f in enumerate(forecast):
            # Increase uncertainty over time
            period_error = error * (1 + i * 0.1)
            margin = z * period_error
            
            intervals.append({
                'period': f['period'],
                'lower': max(0, f['value'] - margin),
                'upper': f['value'] + margin,
                'confidence_level': level
            })
        
        return intervals
    
    def _detect_seasonal_patterns(self, history: List[Dict]) -> Dict[str, Any]:
        """Detect seasonal patterns in demand."""
        values = [h['value'] for h in history]
        
        if len(values) < 365:
            return {'is_seasonal': False, 'reason': 'Insufficient data'}
        
        # Simple seasonality detection
        # Check for quarterly patterns
        quarterly_avgs = []
        for q in range(4):
            q_values = values[q*90:(q+1)*90]
            if q_values:
                quarterly_avgs.append(np.mean(q_values))
        
        if quarterly_avgs:
            cv = np.std(quarterly_avgs) / np.mean(quarterly_avgs)
            is_seasonal = cv > 0.1
            
            if is_seasonal:
                peak_q = quarterly_avgs.index(max(quarterly_avgs))
                seasons = ['Q1 (Winter)', 'Q2 (Spring)', 'Q3 (Summer)', 'Q4 (Fall)']
                
                return {
                    'is_seasonal': True,
                    'pattern': 'quarterly',
                    'strength': cv,
                    'peak_season': seasons[peak_q],
                    'seasonal_factors': [q/np.mean(quarterly_avgs) for q in quarterly_avgs]
                }
        
        return {'is_seasonal': False, 'reason': 'No clear pattern detected'}
    
    def _calculate_demand_volatility(self, history: List[Dict]) -> Dict[str, Any]:
        """Calculate demand volatility metrics."""
        values = [h['value'] for h in history]
        
        mean = np.mean(values)
        std = np.std(values)
        cv = std / mean if mean > 0 else 0
        
        # Calculate other volatility metrics
        mad = np.mean(np.abs(np.diff(values)))  # Mean absolute difference
        
        # Classify volatility
        if cv < 0.2:
            level = 'low'
        elif cv < 0.5:
            level = 'medium'
        else:
            level = 'high'
        
        return {
            'coefficient_of_variation': cv,
            'standard_deviation': std,
            'mean_absolute_difference': mad,
            'level': level,
            'stability_score': 1 - min(cv, 1)  # 0 to 1, higher is more stable
        }
    
    def _analyze_external_correlations(self, history: List[Dict], 
                                     context: AgentContext) -> Dict[str, Any]:
        """Analyze correlations with external factors."""
        # This would correlate with real external data
        # For now, returning mock correlations
        
        return {
            'weather': {
                'correlation': 0.3,
                'significance': 'moderate',
                'factor': 'temperature'
            },
            'promotions': {
                'correlation': 0.7,
                'significance': 'high',
                'factor': 'discount_rate'
            },
            'seasonality': {
                'correlation': 0.5,
                'significance': 'moderate',
                'factor': 'quarter'
            }
        }
    
    def _classify_demand_pattern(self, trend: Dict, seasonality: Dict, 
                                volatility: Dict) -> str:
        """Classify overall demand pattern."""
        if volatility.get('level') == 'low' and not seasonality.get('is_seasonal'):
            return 'stable'
        elif volatility.get('level') == 'high':
            return 'erratic'
        elif seasonality.get('is_seasonal'):
            return 'seasonal'
        elif abs(trend.get('slope', 0)) > 0.1:
            return 'trending'
        else:
            return 'intermittent'
    
    def _assess_anomaly_severity(self, anomalies: List[Dict]) -> str:
        """Assess severity of detected anomalies."""
        if not anomalies:
            return 'none'
        
        max_deviation = max(abs(a.get('z_score', 0)) for a in anomalies)
        
        if max_deviation > 4:
            return 'high'
        elif max_deviation > 3:
            return 'medium'
        else:
            return 'low'
    
    def _get_forecast_accuracy_data(self, periods: int) -> List[Dict]:
        """Get historical forecast vs actual data."""
        # This would retrieve real historical forecasts
        # For now, generating mock data
        
        accuracy_data = []
        for i in range(periods):
            period_data = {
                'period': f"Period {i+1}",
                'actuals': [100 + np.random.normal(0, 10) for _ in range(30)],
                'forecasts': [100 + np.random.normal(2, 12) for _ in range(30)]
            }
            accuracy_data.append(period_data)
        
        return accuracy_data
    
    def _calculate_accuracy_trend(self, accuracy_results: Dict) -> Dict[str, Any]:
        """Calculate trend in forecast accuracy."""
        if not accuracy_results:
            return {'improving': False, 'trend': 'unknown'}
        
        accuracies = [r.get('forecast_accuracy', 0) for r in accuracy_results.values()]
        
        if len(accuracies) < 2:
            return {'improving': False, 'trend': 'insufficient_data'}
        
        # Simple trend check
        first_half = np.mean(accuracies[:len(accuracies)//2])
        second_half = np.mean(accuracies[len(accuracies)//2:])
        
        improvement = second_half - first_half
        
        return {
            'improving': improvement > 0,
            'trend': 'improving' if improvement > 5 else 'stable' if improvement > -5 else 'declining',
            'improvement_rate': improvement
        }
    
    def _test_forecast_method(self, history: List[Dict], method: str) -> Dict[str, Any]:
        """Test forecast method performance."""
        # Split data for testing
        train_size = int(len(history) * 0.8)
        train = history[:train_size]
        test = history[train_size:]
        
        # Generate forecast
        import time
        start_time = time.time()
        
        forecast_result = self._apply_forecast_method(train, method, len(test))
        
        execution_time = time.time() - start_time
        
        # Calculate accuracy
        actual_values = [t['value'] for t in test]
        forecast_values = [f['value'] for f in forecast_result['forecast'][:len(test)]]
        
        # MAPE
        mape = np.mean([abs((a - f) / a) * 100 for a, f in zip(actual_values, forecast_values) if a != 0])
        accuracy = 100 - mape
        
        return {
            'accuracy': accuracy,
            'mape': mape,
            'execution_time': execution_time,
            'confidence': forecast_result['confidence']
        }
    
    def _select_optimal_method(self, performance: Dict[str, Dict], 
                              goal: str) -> str:
        """Select optimal method based on goal."""
        if goal == 'accuracy':
            # Prioritize accuracy
            return max(performance.items(), key=lambda x: x[1]['accuracy'])[0]
        elif goal == 'cost':
            # Prioritize low cost with acceptable accuracy
            acceptable = {k: v for k, v in performance.items() if v['accuracy'] > 80}
            if acceptable:
                return min(acceptable.items(), key=lambda x: x[1]['cost_score'])[0]
            else:
                return 'moving_average'  # Fallback to cheapest
        else:  # balanced
            # Balance accuracy and cost
            scores = {}
            for method, perf in performance.items():
                # Weighted score: 70% accuracy, 30% cost (inverted)
                scores[method] = (perf['accuracy'] / 100) * 0.7 + (1 - perf['cost_score']) * 0.3
            return max(scores.items(), key=lambda x: x[1])[0]
    
    def _calculate_expected_improvement(self, performance: Dict[str, Dict], 
                                       new_method: str, current_method: str) -> Dict:
        """Calculate expected improvement from method change."""
        if current_method not in performance or new_method not in performance:
            return {'accuracy_gain': 0, 'cost_change': 0}
        
        current = performance[current_method]
        new = performance[new_method]
        
        return {
            'accuracy_gain': (new['accuracy'] - current['accuracy']) / 100,
            'cost_change': new['cost_score'] - current['cost_score'],
            'worth_switching': (new['accuracy'] - current['accuracy']) > 5
        }
    
    def _calculate_avg_improvement(self, results: Dict) -> float:
        """Calculate average accuracy improvement."""
        improvements = [r['expected_improvement']['accuracy_gain'] 
                       for r in results.values() 
                       if 'expected_improvement' in r]
        return np.mean(improvements) if improvements else 0
    
    def _calculate_cost_saving(self, results: Dict) -> float:
        """Calculate potential cost savings."""
        # Simplified calculation
        cost_changes = [r['expected_improvement']['cost_change'] 
                       for r in results.values() 
                       if 'expected_improvement' in r]
        
        # Assume $0.10 per forecast per cost unit
        avg_change = np.mean(cost_changes) if cost_changes else 0
        daily_forecasts = len(results) * 10  # Assume 10 forecasts per product per day
        
        return max(0, -avg_change * daily_forecasts * 0.10 * 30)  # Monthly saving