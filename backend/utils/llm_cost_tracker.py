"""
LLM Cost Tracking Utility
========================

Track and monitor LLM API usage costs with alerts and reporting.
"""

import os
import json
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Any, List, Optional
from pathlib import Path
import threading
from collections import defaultdict

from backend.config.llm_settings import LLMSettings
from backend.config.settings import settings


class LLMCostTracker:
    """Track LLM API usage and costs with persistence."""
    
    def __init__(self, log_dir: str = "logs"):
        """Initialize cost tracker."""
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        self.cost_log_file = self.log_dir / "llm_costs.json"
        self.daily_log_file = self.log_dir / f"llm_costs_{datetime.now().strftime('%Y%m%d')}.json"
        
        # In-memory tracking
        self.current_session = {
            'start_time': datetime.utcnow().isoformat(),
            'usage': []
        }
        
        # Thread-safe lock for file operations
        self._lock = threading.Lock()
        
        # Logger
        self.logger = logging.getLogger("LLMCostTracker")
        
        # Load existing data
        self._load_existing_data()
    
    def _load_existing_data(self):
        """Load existing cost data from file."""
        if self.cost_log_file.exists():
            try:
                with open(self.cost_log_file, 'r') as f:
                    self.historical_data = json.load(f)
            except Exception as e:
                self.logger.error(f"Failed to load cost data: {e}")
                self.historical_data = {'sessions': []}
        else:
            self.historical_data = {'sessions': []}
    
    def track_usage(self, agent_type: str, model: str, provider: str,
                   input_tokens: int, output_tokens: int,
                   execution_id: str, success: bool = True):
        """Track a single LLM API usage."""
        
        # Calculate cost
        if model in LLMSettings.MODEL_SPECS:
            spec = LLMSettings.MODEL_SPECS[model]
            cost = spec.calculate_cost(input_tokens, output_tokens)
        else:
            # Fallback cost estimation
            cost = Decimal('0.001') * (input_tokens + output_tokens) / 1000
        
        usage_record = {
            'timestamp': datetime.utcnow().isoformat(),
            'agent_type': agent_type,
            'model': model,
            'provider': provider,
            'input_tokens': input_tokens,
            'output_tokens': output_tokens,
            'total_tokens': input_tokens + output_tokens,
            'cost': float(cost),
            'execution_id': execution_id,
            'success': success
        }
        
        # Add to current session
        with self._lock:
            self.current_session['usage'].append(usage_record)
            
            # Write to daily log
            self._append_to_daily_log(usage_record)
        
        # Check cost alerts
        self._check_cost_alerts()
        
        # Log if detailed logging is enabled
        if settings.LLM_COST_TRACKING_ENABLED and LLMSettings.COST_TRACKING['detailed_logging']:
            self.logger.info(
                f"LLM Usage: {agent_type} | {model} | "
                f"Tokens: {input_tokens}+{output_tokens} | "
                f"Cost: ${cost:.4f}"
            )
        
        return usage_record
    
    def _append_to_daily_log(self, usage_record: Dict[str, Any]):
        """Append usage to daily log file."""
        try:
            if self.daily_log_file.exists():
                with open(self.daily_log_file, 'r') as f:
                    daily_data = json.load(f)
            else:
                daily_data = {'date': datetime.now().strftime('%Y-%m-%d'), 'usage': []}
            
            daily_data['usage'].append(usage_record)
            
            with open(self.daily_log_file, 'w') as f:
                json.dump(daily_data, f, indent=2)
        except Exception as e:
            self.logger.error(f"Failed to write to daily log: {e}")
    
    def _check_cost_alerts(self):
        """Check if cost thresholds are exceeded."""
        # Get today's costs
        today_cost = self.get_daily_cost()
        
        # Check daily threshold
        if today_cost > settings.LLM_DAILY_COST_LIMIT:
            self.logger.warning(
                f"⚠️  Daily LLM cost limit exceeded! "
                f"Current: ${today_cost:.2f}, Limit: ${settings.LLM_DAILY_COST_LIMIT:.2f}"
            )
            # Could trigger additional actions here (email, webhook, etc.)
        
        # Check monthly threshold
        monthly_cost = self.get_monthly_cost()
        if monthly_cost > settings.LLM_MONTHLY_COST_LIMIT:
            self.logger.warning(
                f"⚠️  Monthly LLM cost limit exceeded! "
                f"Current: ${monthly_cost:.2f}, Limit: ${settings.LLM_MONTHLY_COST_LIMIT:.2f}"
            )
    
    def get_daily_cost(self, date: Optional[datetime] = None) -> float:
        """Get total cost for a specific day."""
        if date is None:
            date = datetime.now()
        
        date_str = date.strftime('%Y-%m-%d')
        daily_file = self.log_dir / f"llm_costs_{date.strftime('%Y%m%d')}.json"
        
        if daily_file.exists():
            try:
                with open(daily_file, 'r') as f:
                    daily_data = json.load(f)
                return sum(u['cost'] for u in daily_data.get('usage', []))
            except:
                pass
        
        return 0.0
    
    def get_monthly_cost(self, year: Optional[int] = None, month: Optional[int] = None) -> float:
        """Get total cost for a specific month."""
        now = datetime.now()
        if year is None:
            year = now.year
        if month is None:
            month = now.month
        
        total_cost = 0.0
        
        # Iterate through all days in the month
        for day in range(1, 32):
            try:
                date = datetime(year, month, day)
                if date > now:
                    break
                total_cost += self.get_daily_cost(date)
            except ValueError:
                # Invalid date (e.g., Feb 30)
                break
        
        return total_cost
    
    def get_cost_breakdown(self, start_date: Optional[datetime] = None,
                          end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Get detailed cost breakdown for a date range."""
        if end_date is None:
            end_date = datetime.now()
        if start_date is None:
            start_date = end_date - timedelta(days=7)
        
        # Collect all usage data in range
        all_usage = []
        current_date = start_date
        
        while current_date <= end_date:
            daily_file = self.log_dir / f"llm_costs_{current_date.strftime('%Y%m%d')}.json"
            if daily_file.exists():
                try:
                    with open(daily_file, 'r') as f:
                        daily_data = json.load(f)
                    all_usage.extend(daily_data.get('usage', []))
                except:
                    pass
            current_date += timedelta(days=1)
        
        # Generate report using LLMSettings
        return LLMSettings.get_cost_report(all_usage)
    
    def get_agent_efficiency_report(self) -> Dict[str, Any]:
        """Analyze cost efficiency by agent type."""
        # Get last 7 days of data
        breakdown = self.get_cost_breakdown()
        
        agent_efficiency = {}
        
        for agent_type, cost in breakdown.get('by_agent', {}).items():
            # Get agent configuration
            try:
                config = LLMSettings.get_model_for_agent(agent_type)
                estimated_daily = LLMSettings.calculate_estimated_cost(agent_type, 100)
                
                agent_efficiency[agent_type] = {
                    'actual_cost': cost,
                    'estimated_cost_per_100_calls': float(estimated_daily['daily_cost']),
                    'primary_model': config['model'],
                    'optimization_potential': self._calculate_optimization_potential(agent_type, breakdown)
                }
            except:
                pass
        
        return {
            'period': '7_days',
            'total_cost': breakdown['total_cost'],
            'agent_efficiency': agent_efficiency,
            'recommendations': self._generate_cost_recommendations(breakdown)
        }
    
    def _calculate_optimization_potential(self, agent_type: str, 
                                        breakdown: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate potential cost savings through optimization."""
        # This is a simplified example
        current_cost = breakdown['by_agent'].get(agent_type, 0)
        
        # Check if using expensive models for simple tasks
        if agent_type == 'inventory_monitor' and current_cost > 10:
            return {
                'potential_savings': '60-80%',
                'recommendation': 'Switch to claude-3-haiku for routine monitoring'
            }
        
        return {
            'potential_savings': '0-20%',
            'recommendation': 'Current model selection is optimal'
        }
    
    def _generate_cost_recommendations(self, breakdown: Dict[str, Any]) -> List[str]:
        """Generate cost optimization recommendations."""
        recommendations = []
        
        # Check if certain providers are dominating costs
        by_provider = breakdown.get('by_provider', {})
        if by_provider:
            max_provider = max(by_provider.items(), key=lambda x: x[1])
            if max_provider[1] > breakdown['total_cost'] * 0.8:
                recommendations.append(
                    f"Consider diversifying providers - {max_provider[0]} accounts for "
                    f"{max_provider[1]/breakdown['total_cost']*100:.0f}% of costs"
                )
        
        # Check for expensive models being overused
        by_model = breakdown.get('by_model', {})
        for model, data in by_model.items():
            if model in ['claude-3-opus-20240229', 'gpt-4'] and data['calls'] > 100:
                recommendations.append(
                    f"High usage of expensive model {model} ({data['calls']} calls). "
                    f"Consider using for complex tasks only."
                )
        
        return recommendations
    
    def export_cost_report(self, format: str = 'json') -> str:
        """Export cost report in various formats."""
        report = {
            'generated_at': datetime.utcnow().isoformat(),
            'daily_cost': self.get_daily_cost(),
            'monthly_cost': self.get_monthly_cost(),
            'weekly_breakdown': self.get_cost_breakdown(),
            'efficiency_report': self.get_agent_efficiency_report()
        }
        
        if format == 'json':
            return json.dumps(report, indent=2)
        elif format == 'csv':
            # Simplified CSV export
            lines = [
                "Date,Agent,Model,Provider,Input Tokens,Output Tokens,Cost",
            ]
            breakdown = self.get_cost_breakdown()
            # Would need to implement proper CSV generation
            return "\n".join(lines)
        else:
            raise ValueError(f"Unsupported format: {format}")


# Global cost tracker instance
_cost_tracker = None


def get_cost_tracker() -> LLMCostTracker:
    """Get or create the global cost tracker instance."""
    global _cost_tracker
    if _cost_tracker is None:
        _cost_tracker = LLMCostTracker()
    return _cost_tracker


# Example usage and demonstration
if __name__ == "__main__":
    tracker = get_cost_tracker()
    
    print("💰 LLM Cost Tracking Demonstration")
    print("=" * 60)
    
    # Simulate some usage
    print("\nSimulating agent usage...")
    
    # Inventory monitor (high frequency, low cost)
    for i in range(5):
        tracker.track_usage(
            agent_type='inventory_monitor',
            model='claude-3-haiku-20240307',
            provider='anthropic',
            input_tokens=500,
            output_tokens=200,
            execution_id=f'inv_{i}',
            success=True
        )
    
    # Risk assessor (low frequency, high cost)
    tracker.track_usage(
        agent_type='risk_assessor',
        model='claude-3-opus-20240229',
        provider='anthropic',
        input_tokens=2000,
        output_tokens=1500,
        execution_id='risk_001',
        success=True
    )
    
    # Get reports
    print(f"\nToday's Cost: ${tracker.get_daily_cost():.4f}")
    print(f"Monthly Cost: ${tracker.get_monthly_cost():.2f}")
    
    # Efficiency report
    efficiency = tracker.get_agent_efficiency_report()
    print("\nEfficiency Report:")
    print(json.dumps(efficiency, indent=2))
    
    print("\n" + "=" * 60)