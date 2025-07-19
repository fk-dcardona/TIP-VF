"""
Cost Tracking and Alert System - Comprehensive LLM cost monitoring
Tracks spending across providers, implements budgets, and provides cost alerts.
"""

import asyncio
import threading
import time
import json
from datetime import datetime, timezone, timedelta, date
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
import os
from collections import defaultdict, deque
import logging
import sqlite3
from pathlib import Path

from ..agent_protocol.monitoring.agent_logger import get_agent_logger


class CostAlertLevel(Enum):
    """Cost alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


class BudgetPeriod(Enum):
    """Budget period types."""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


@dataclass
class CostEntry:
    """Individual cost entry."""
    id: str
    timestamp: datetime
    provider: str  # openai, anthropic, google
    model: str
    organization_id: str
    agent_id: str
    execution_id: str
    user_id: str
    tokens_input: int
    tokens_output: int
    tokens_total: int
    cost: float
    cost_input: float
    cost_output: float
    request_type: str  # completion, embedding, fine_tune
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BudgetRule:
    """Budget rule configuration."""
    id: str
    name: str
    period: BudgetPeriod
    amount: float
    alert_thresholds: List[float]  # [0.5, 0.8, 0.9, 1.0] for 50%, 80%, 90%, 100%
    scope: str  # global, organization, agent, user
    scope_id: Optional[str] = None
    enabled: bool = True
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CostAlert:
    """Cost alert instance."""
    id: str
    budget_rule_id: str
    level: CostAlertLevel
    message: str
    current_amount: float
    budget_amount: float
    threshold_percentage: float
    triggered_at: datetime
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CostSummary:
    """Cost summary for a period."""
    period_start: datetime
    period_end: datetime
    total_cost: float
    total_tokens: int
    provider_breakdown: Dict[str, float]
    model_breakdown: Dict[str, float]
    organization_breakdown: Dict[str, float]
    agent_breakdown: Dict[str, float]
    request_count: int
    avg_cost_per_request: float
    avg_tokens_per_request: float


class CostTrackingSystem:
    """Comprehensive cost tracking and alert system for LLM usage."""
    
    def __init__(self, db_path: Optional[str] = None):
        """Initialize cost tracking system."""
        self.logger = get_agent_logger()
        
        # Database setup
        self.db_path = db_path or "database/cost_tracking.db"
        self._init_database()
        
        # In-memory tracking
        self.cost_entries: deque = deque(maxlen=10000)  # Recent entries for fast access
        self.budget_rules: Dict[str, BudgetRule] = {}
        self.active_alerts: Dict[str, CostAlert] = {}
        self.alert_history: deque = deque(maxlen=1000)
        
        # Real-time statistics
        self.current_costs = {
            'today': 0.0,
            'this_week': 0.0,
            'this_month': 0.0,
            'this_year': 0.0
        }
        
        # Provider pricing (updated regularly)
        self.provider_pricing = self._load_provider_pricing()
        
        # Alert callbacks
        self.alert_callbacks: List[Callable[[CostAlert], None]] = []
        
        # Configuration
        self.alert_check_interval = 60  # Check alerts every minute
        self.cost_aggregation_interval = 300  # Aggregate costs every 5 minutes
        
        # Threading
        self.tracking_lock = threading.RLock()
        self.alert_thread = None
        self.aggregation_thread = None
        self.tracking_active = False
        
        # Load existing data
        self._load_budget_rules()
        self._load_recent_costs()
        
        # Start tracking
        self._start_tracking()
    
    def _init_database(self):
        """Initialize SQLite database for cost tracking."""
        # Ensure directory exists
        db_dir = os.path.dirname(self.db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Cost entries table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cost_entries (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    model TEXT NOT NULL,
                    organization_id TEXT NOT NULL,
                    agent_id TEXT NOT NULL,
                    execution_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    tokens_input INTEGER NOT NULL,
                    tokens_output INTEGER NOT NULL,
                    tokens_total INTEGER NOT NULL,
                    cost REAL NOT NULL,
                    cost_input REAL NOT NULL,
                    cost_output REAL NOT NULL,
                    request_type TEXT NOT NULL,
                    metadata TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Budget rules table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS budget_rules (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    period TEXT NOT NULL,
                    amount REAL NOT NULL,
                    alert_thresholds TEXT NOT NULL,
                    scope TEXT NOT NULL,
                    scope_id TEXT,
                    enabled INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    metadata TEXT,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Cost alerts table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cost_alerts (
                    id TEXT PRIMARY KEY,
                    budget_rule_id TEXT NOT NULL,
                    level TEXT NOT NULL,
                    message TEXT NOT NULL,
                    current_amount REAL NOT NULL,
                    budget_amount REAL NOT NULL,
                    threshold_percentage REAL NOT NULL,
                    triggered_at TEXT NOT NULL,
                    acknowledged INTEGER DEFAULT 0,
                    acknowledged_by TEXT,
                    acknowledged_at TEXT,
                    metadata TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create indexes
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_cost_entries_timestamp ON cost_entries(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_cost_entries_org ON cost_entries(organization_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_cost_entries_agent ON cost_entries(agent_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_cost_entries_provider ON cost_entries(provider)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_cost_alerts_triggered ON cost_alerts(triggered_at)')
            
            conn.commit()
    
    def _load_provider_pricing(self) -> Dict[str, Dict[str, Dict[str, float]]]:
        """Load current provider pricing."""
        return {
            'openai': {
                'gpt-4-turbo': {'input': 0.01, 'output': 0.03},  # per 1K tokens
                'gpt-4': {'input': 0.03, 'output': 0.06},
                'gpt-3.5-turbo': {'input': 0.0015, 'output': 0.002},
                'text-embedding-3-large': {'input': 0.00013, 'output': 0.0},
                'text-embedding-3-small': {'input': 0.00002, 'output': 0.0}
            },
            'anthropic': {
                'claude-3-opus': {'input': 0.015, 'output': 0.075},
                'claude-3-sonnet': {'input': 0.003, 'output': 0.015},
                'claude-3-haiku': {'input': 0.00025, 'output': 0.00125}
            },
            'google': {
                'gemini-pro': {'input': 0.0005, 'output': 0.0015},
                'gemini-pro-vision': {'input': 0.0005, 'output': 0.0015}
            }
        }
    
    def _start_tracking(self):
        """Start cost tracking threads."""
        self.tracking_active = True
        
        # Start alert checking thread
        self.alert_thread = threading.Thread(
            target=self._alert_check_loop,
            daemon=True
        )
        self.alert_thread.start()
        
        # Start cost aggregation thread
        self.aggregation_thread = threading.Thread(
            target=self._cost_aggregation_loop,
            daemon=True
        )
        self.aggregation_thread.start()
        
        self.logger.log_custom_event(
            "cost_tracking_started",
            "Cost tracking system started",
            {"component": "cost_tracking"}
        )
    
    def record_cost(
        self,
        provider: str,
        model: str,
        organization_id: str,
        agent_id: str,
        execution_id: str,
        user_id: str,
        tokens_input: int,
        tokens_output: int,
        request_type: str = "completion",
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Record a cost entry."""
        # Calculate costs
        tokens_total = tokens_input + tokens_output
        
        # Get pricing
        if provider in self.provider_pricing and model in self.provider_pricing[provider]:
            pricing = self.provider_pricing[provider][model]
            cost_input = (tokens_input / 1000) * pricing['input']
            cost_output = (tokens_output / 1000) * pricing['output']
            total_cost = cost_input + cost_output
        else:
            # Fallback pricing estimation
            cost_input = (tokens_input / 1000) * 0.001  # $0.001 per 1K tokens
            cost_output = (tokens_output / 1000) * 0.002  # $0.002 per 1K tokens
            total_cost = cost_input + cost_output
            
            self.logger.log_warning(
                f"Unknown pricing for {provider}/{model}, using fallback",
                context={
                    "provider": provider,
                    "model": model,
                    "tokens": tokens_total
                }
            )
        
        # Create cost entry
        entry_id = f"cost_{int(time.time() * 1000)}_{hash((provider, model, execution_id)) % 10000:04d}"
        entry = CostEntry(
            id=entry_id,
            timestamp=datetime.now(timezone.utc),
            provider=provider,
            model=model,
            organization_id=organization_id,
            agent_id=agent_id,
            execution_id=execution_id,
            user_id=user_id,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            tokens_total=tokens_total,
            cost=total_cost,
            cost_input=cost_input,
            cost_output=cost_output,
            request_type=request_type,
            metadata=metadata or {}
        )
        
        # Store in database and memory
        self._store_cost_entry(entry)
        
        with self.tracking_lock:
            self.cost_entries.append(entry)
            
            # Update current costs
            today = date.today()
            if entry.timestamp.date() == today:
                self.current_costs['today'] += total_cost
        
        # Log cost entry
        self.logger.log_custom_event(
            "cost_recorded",
            f"Cost recorded: ${total_cost:.4f} for {provider}/{model}",
            {
                "entry_id": entry_id,
                "provider": provider,
                "model": model,
                "organization_id": organization_id,
                "agent_id": agent_id,
                "execution_id": execution_id,
                "tokens_total": tokens_total,
                "cost": total_cost
            }
        )
        
        return entry_id
    
    def _store_cost_entry(self, entry: CostEntry):
        """Store cost entry in database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO cost_entries (
                        id, timestamp, provider, model, organization_id,
                        agent_id, execution_id, user_id, tokens_input,
                        tokens_output, tokens_total, cost, cost_input,
                        cost_output, request_type, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    entry.id,
                    entry.timestamp.isoformat(),
                    entry.provider,
                    entry.model,
                    entry.organization_id,
                    entry.agent_id,
                    entry.execution_id,
                    entry.user_id,
                    entry.tokens_input,
                    entry.tokens_output,
                    entry.tokens_total,
                    entry.cost,
                    entry.cost_input,
                    entry.cost_output,
                    entry.request_type,
                    json.dumps(entry.metadata)
                ))
                conn.commit()
        except Exception as e:
            self.logger.log_error(
                "Failed to store cost entry",
                error=str(e),
                error_type="database_error",
                context={"entry_id": entry.id}
            )
    
    def create_budget_rule(
        self,
        name: str,
        period: BudgetPeriod,
        amount: float,
        alert_thresholds: List[float],
        scope: str,
        scope_id: Optional[str] = None,
        enabled: bool = True,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a new budget rule."""
        rule_id = f"budget_{int(time.time())}_{hash(name) % 1000:03d}"
        
        rule = BudgetRule(
            id=rule_id,
            name=name,
            period=period,
            amount=amount,
            alert_thresholds=sorted(alert_thresholds),
            scope=scope,
            scope_id=scope_id,
            enabled=enabled,
            metadata=metadata or {}
        )
        
        # Store in database
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO budget_rules (
                        id, name, period, amount, alert_thresholds,
                        scope, scope_id, enabled, created_at, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    rule.id,
                    rule.name,
                    rule.period.value,
                    rule.amount,
                    json.dumps(rule.alert_thresholds),
                    rule.scope,
                    rule.scope_id,
                    1 if rule.enabled else 0,
                    rule.created_at.isoformat(),
                    json.dumps(rule.metadata)
                ))
                conn.commit()
        except Exception as e:
            self.logger.log_error(
                "Failed to store budget rule",
                error=str(e),
                error_type="database_error"
            )
            return ""
        
        # Store in memory
        with self.tracking_lock:
            self.budget_rules[rule_id] = rule
        
        self.logger.log_custom_event(
            "budget_rule_created",
            f"Budget rule created: {name} (${amount}/{period.value})",
            {
                "rule_id": rule_id,
                "name": name,
                "period": period.value,
                "amount": amount,
                "scope": scope,
                "scope_id": scope_id
            }
        )
        
        return rule_id
    
    def check_budgets(self) -> List[CostAlert]:
        """Check all budget rules and generate alerts if needed."""
        alerts = []
        
        with self.tracking_lock:
            for rule in self.budget_rules.values():
                if not rule.enabled:
                    continue
                
                # Calculate current spending for the rule's scope and period
                current_amount = self._calculate_period_spending(rule)
                
                # Check alert thresholds
                for threshold in rule.alert_thresholds:
                    threshold_amount = rule.amount * threshold
                    
                    if current_amount >= threshold_amount:
                        # Generate alert if not already active
                        alert_key = f"{rule.id}_{threshold}"
                        
                        if alert_key not in self.active_alerts:
                            alert = self._create_cost_alert(rule, current_amount, threshold)
                            alerts.append(alert)
                            self.active_alerts[alert_key] = alert
                            self.alert_history.append(alert)
        
        return alerts
    
    def _calculate_period_spending(self, rule: BudgetRule) -> float:
        """Calculate spending for a budget rule's period and scope."""
        now = datetime.now(timezone.utc)
        
        # Determine period start
        if rule.period == BudgetPeriod.DAILY:
            period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif rule.period == BudgetPeriod.WEEKLY:
            days_since_monday = now.weekday()
            period_start = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        elif rule.period == BudgetPeriod.MONTHLY:
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif rule.period == BudgetPeriod.YEARLY:
            period_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            period_start = now - timedelta(days=1)  # Default to daily
        
        # Query database for period spending
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Build query based on scope
                base_query = '''
                    SELECT SUM(cost) FROM cost_entries 
                    WHERE timestamp >= ?
                '''
                params = [period_start.isoformat()]
                
                if rule.scope == 'organization' and rule.scope_id:
                    base_query += ' AND organization_id = ?'
                    params.append(rule.scope_id)
                elif rule.scope == 'agent' and rule.scope_id:
                    base_query += ' AND agent_id = ?'
                    params.append(rule.scope_id)
                elif rule.scope == 'user' and rule.scope_id:
                    base_query += ' AND user_id = ?'
                    params.append(rule.scope_id)
                # 'global' scope needs no additional filtering
                
                cursor.execute(base_query, params)
                result = cursor.fetchone()
                
                return result[0] if result[0] is not None else 0.0
        
        except Exception as e:
            self.logger.log_error(
                "Failed to calculate period spending",
                error=str(e),
                error_type="database_error",
                context={"rule_id": rule.id}
            )
            return 0.0
    
    def _create_cost_alert(self, rule: BudgetRule, current_amount: float, threshold: float) -> CostAlert:
        """Create a cost alert."""
        alert_id = f"alert_{rule.id}_{int(threshold * 100)}_{int(time.time())}"
        
        # Determine alert level
        if threshold >= 1.0:
            level = CostAlertLevel.EMERGENCY
        elif threshold >= 0.9:
            level = CostAlertLevel.CRITICAL
        elif threshold >= 0.7:
            level = CostAlertLevel.WARNING
        else:
            level = CostAlertLevel.INFO
        
        # Create message
        percentage = (current_amount / rule.amount) * 100
        message = (
            f"Budget alert: {rule.name} has reached {percentage:.1f}% "
            f"(${current_amount:.2f} of ${rule.amount:.2f}) "
            f"for {rule.period.value} period"
        )
        
        alert = CostAlert(
            id=alert_id,
            budget_rule_id=rule.id,
            level=level,
            message=message,
            current_amount=current_amount,
            budget_amount=rule.amount,
            threshold_percentage=threshold * 100,
            triggered_at=datetime.now(timezone.utc)
        )
        
        # Store in database
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO cost_alerts (
                        id, budget_rule_id, level, message, current_amount,
                        budget_amount, threshold_percentage, triggered_at, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    alert.id,
                    alert.budget_rule_id,
                    alert.level.value,
                    alert.message,
                    alert.current_amount,
                    alert.budget_amount,
                    alert.threshold_percentage,
                    alert.triggered_at.isoformat(),
                    json.dumps(alert.metadata)
                ))
                conn.commit()
        except Exception as e:
            self.logger.log_error(
                "Failed to store cost alert",
                error=str(e),
                error_type="database_error"
            )
        
        # Log alert
        self.logger.log_custom_event(
            "cost_alert_triggered",
            message,
            {
                "alert_id": alert_id,
                "rule_id": rule.id,
                "level": level.value,
                "current_amount": current_amount,
                "budget_amount": rule.amount,
                "threshold_percentage": threshold * 100
            }
        )
        
        # Trigger callbacks
        for callback in self.alert_callbacks:
            try:
                callback(alert)
            except Exception as e:
                self.logger.log_error(
                    "Error in cost alert callback",
                    error=str(e),
                    error_type="callback_error"
                )
        
        return alert
    
    def get_cost_summary(
        self,
        start_date: datetime,
        end_date: datetime,
        organization_id: Optional[str] = None,
        agent_id: Optional[str] = None
    ) -> CostSummary:
        """Get cost summary for a period."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Base query
                base_query = '''
                    SELECT provider, model, organization_id, agent_id, 
                           SUM(cost) as total_cost, SUM(tokens_total) as total_tokens,
                           COUNT(*) as request_count
                    FROM cost_entries 
                    WHERE timestamp >= ? AND timestamp <= ?
                '''
                params = [start_date.isoformat(), end_date.isoformat()]
                
                # Add filters
                if organization_id:
                    base_query += ' AND organization_id = ?'
                    params.append(organization_id)
                
                if agent_id:
                    base_query += ' AND agent_id = ?'
                    params.append(agent_id)
                
                # Get overall totals
                cursor.execute(base_query + ' GROUP BY provider, model, organization_id, agent_id', params)
                results = cursor.fetchall()
                
                # Calculate summaries
                total_cost = 0.0
                total_tokens = 0
                total_requests = 0
                provider_breakdown = defaultdict(float)
                model_breakdown = defaultdict(float)
                organization_breakdown = defaultdict(float)
                agent_breakdown = defaultdict(float)
                
                for provider, model, org_id, ag_id, cost, tokens, requests in results:
                    total_cost += cost
                    total_tokens += tokens
                    total_requests += requests
                    
                    provider_breakdown[provider] += cost
                    model_breakdown[f"{provider}/{model}"] += cost
                    organization_breakdown[org_id] += cost
                    agent_breakdown[ag_id] += cost
                
                avg_cost_per_request = total_cost / total_requests if total_requests > 0 else 0
                avg_tokens_per_request = total_tokens / total_requests if total_requests > 0 else 0
                
                return CostSummary(
                    period_start=start_date,
                    period_end=end_date,
                    total_cost=total_cost,
                    total_tokens=total_tokens,
                    provider_breakdown=dict(provider_breakdown),
                    model_breakdown=dict(model_breakdown),
                    organization_breakdown=dict(organization_breakdown),
                    agent_breakdown=dict(agent_breakdown),
                    request_count=total_requests,
                    avg_cost_per_request=avg_cost_per_request,
                    avg_tokens_per_request=avg_tokens_per_request
                )
        
        except Exception as e:
            self.logger.log_error(
                "Failed to generate cost summary",
                error=str(e),
                error_type="database_error"
            )
            
            # Return empty summary
            return CostSummary(
                period_start=start_date,
                period_end=end_date,
                total_cost=0.0,
                total_tokens=0,
                provider_breakdown={},
                model_breakdown={},
                organization_breakdown={},
                agent_breakdown={},
                request_count=0,
                avg_cost_per_request=0.0,
                avg_tokens_per_request=0.0
            )
    
    def get_current_costs(self) -> Dict[str, float]:
        """Get current cost totals."""
        now = datetime.now(timezone.utc)
        
        costs = {}
        
        # Today
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        summary = self.get_cost_summary(today_start, now)
        costs['today'] = summary.total_cost
        
        # This week
        week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        summary = self.get_cost_summary(week_start, now)
        costs['this_week'] = summary.total_cost
        
        # This month
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        summary = self.get_cost_summary(month_start, now)
        costs['this_month'] = summary.total_cost
        
        # This year
        year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        summary = self.get_cost_summary(year_start, now)
        costs['this_year'] = summary.total_cost
        
        return costs
    
    def add_alert_callback(self, callback: Callable[[CostAlert], None]):
        """Add callback for cost alerts."""
        self.alert_callbacks.append(callback)
    
    def acknowledge_alert(self, alert_id: str, acknowledged_by: str):
        """Acknowledge a cost alert."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE cost_alerts 
                    SET acknowledged = 1, acknowledged_by = ?, acknowledged_at = ?
                    WHERE id = ?
                ''', (acknowledged_by, datetime.now(timezone.utc).isoformat(), alert_id))
                conn.commit()
            
            # Update in-memory alerts
            with self.tracking_lock:
                for alert in self.active_alerts.values():
                    if alert.id == alert_id:
                        alert.acknowledged = True
                        alert.acknowledged_by = acknowledged_by
                        alert.acknowledged_at = datetime.now(timezone.utc)
                        break
            
            self.logger.log_custom_event(
                "cost_alert_acknowledged",
                f"Cost alert acknowledged: {alert_id}",
                {
                    "alert_id": alert_id,
                    "acknowledged_by": acknowledged_by
                }
            )
        
        except Exception as e:
            self.logger.log_error(
                "Failed to acknowledge alert",
                error=str(e),
                error_type="database_error"
            )
    
    def _load_budget_rules(self):
        """Load budget rules from database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM budget_rules WHERE enabled = 1')
                
                for row in cursor.fetchall():
                    rule = BudgetRule(
                        id=row[0],
                        name=row[1],
                        period=BudgetPeriod(row[2]),
                        amount=row[3],
                        alert_thresholds=json.loads(row[4]),
                        scope=row[5],
                        scope_id=row[6],
                        enabled=bool(row[7]),
                        created_at=datetime.fromisoformat(row[8]),
                        metadata=json.loads(row[9] or '{}')
                    )
                    self.budget_rules[rule.id] = rule
        
        except Exception as e:
            self.logger.log_error(
                "Failed to load budget rules",
                error=str(e),
                error_type="database_error"
            )
    
    def _load_recent_costs(self):
        """Load recent cost entries from database."""
        try:
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT * FROM cost_entries 
                    WHERE timestamp >= ? 
                    ORDER BY timestamp DESC 
                    LIMIT 1000
                ''', (cutoff_time.isoformat(),))
                
                for row in cursor.fetchall():
                    entry = CostEntry(
                        id=row[0],
                        timestamp=datetime.fromisoformat(row[1]),
                        provider=row[2],
                        model=row[3],
                        organization_id=row[4],
                        agent_id=row[5],
                        execution_id=row[6],
                        user_id=row[7],
                        tokens_input=row[8],
                        tokens_output=row[9],
                        tokens_total=row[10],
                        cost=row[11],
                        cost_input=row[12],
                        cost_output=row[13],
                        request_type=row[14],
                        metadata=json.loads(row[15] or '{}')
                    )
                    self.cost_entries.append(entry)
        
        except Exception as e:
            self.logger.log_error(
                "Failed to load recent costs",
                error=str(e),
                error_type="database_error"
            )
    
    def _alert_check_loop(self):
        """Periodically check budget alerts."""
        while self.tracking_active:
            try:
                alerts = self.check_budgets()
                
                if alerts:
                    self.logger.log_custom_event(
                        "budget_alerts_checked",
                        f"Generated {len(alerts)} cost alerts",
                        {"alert_count": len(alerts)}
                    )
                
                time.sleep(self.alert_check_interval)
                
            except Exception as e:
                self.logger.log_error(
                    "Error in alert check loop",
                    error=str(e),
                    error_type="monitoring_error"
                )
                time.sleep(self.alert_check_interval)
    
    def _cost_aggregation_loop(self):
        """Periodically aggregate and update cost statistics."""
        while self.tracking_active:
            try:
                # Update current costs
                current_costs = self.get_current_costs()
                
                with self.tracking_lock:
                    self.current_costs.update(current_costs)
                
                time.sleep(self.cost_aggregation_interval)
                
            except Exception as e:
                self.logger.log_error(
                    "Error in cost aggregation loop",
                    error=str(e),
                    error_type="monitoring_error"
                )
                time.sleep(self.cost_aggregation_interval)
    
    def stop_tracking(self):
        """Stop cost tracking."""
        self.tracking_active = False
        
        if self.alert_thread and self.alert_thread.is_alive():
            self.alert_thread.join(timeout=5)
        
        if self.aggregation_thread and self.aggregation_thread.is_alive():
            self.aggregation_thread.join(timeout=5)
        
        self.logger.log_custom_event(
            "cost_tracking_stopped",
            "Cost tracking system stopped",
            {"component": "cost_tracking"}
        )


# Global instance
_cost_tracking_system = None

def get_cost_tracking_system() -> CostTrackingSystem:
    """Get global cost tracking system instance."""
    global _cost_tracking_system
    if _cost_tracking_system is None:
        _cost_tracking_system = CostTrackingSystem()
    return _cost_tracking_system