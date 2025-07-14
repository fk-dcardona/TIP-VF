"""
Error Tracking and Debugging System - Comprehensive error monitoring for agent system
Tracks, categorizes, and analyzes errors across all system components.
"""

import threading
import time
import json
import traceback
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Callable, Union
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict, deque
import logging
import sqlite3
import re
from pathlib import Path

from ..agent_protocol.monitoring.agent_logger import get_agent_logger


class ErrorSeverity(Enum):
    """Error severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    FATAL = "fatal"


class ErrorCategory(Enum):
    """Error categories."""
    AGENT_EXECUTION = "agent_execution"
    LLM_PROVIDER = "llm_provider"
    TOOL_EXECUTION = "tool_execution"
    DATABASE = "database"
    NETWORK = "network"
    AUTHENTICATION = "authentication"
    VALIDATION = "validation"
    SYSTEM = "system"
    CONFIGURATION = "configuration"
    TIMEOUT = "timeout"
    RATE_LIMIT = "rate_limit"
    UNKNOWN = "unknown"


class ErrorStatus(Enum):
    """Error resolution status."""
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    IGNORED = "ignored"
    REOPENED = "reopened"


@dataclass
class ErrorContext:
    """Context information for an error."""
    agent_id: Optional[str] = None
    execution_id: Optional[str] = None
    user_id: Optional[str] = None
    organization_id: Optional[str] = None
    component: Optional[str] = None
    function_name: Optional[str] = None
    request_id: Optional[str] = None
    session_id: Optional[str] = None
    additional_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ErrorInstance:
    """Individual error occurrence."""
    id: str
    error_group_id: str
    timestamp: datetime
    message: str
    stack_trace: Optional[str] = None
    context: ErrorContext = field(default_factory=ErrorContext)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ErrorGroup:
    """Group of similar errors."""
    id: str
    error_hash: str
    first_seen: datetime
    last_seen: datetime
    count: int
    severity: ErrorSeverity
    category: ErrorCategory
    status: ErrorStatus
    title: str
    description: str
    error_pattern: str
    stack_trace_pattern: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    affected_components: List[str] = field(default_factory=list)
    affected_users: set = field(default_factory=set)
    affected_organizations: set = field(default_factory=set)
    resolution_notes: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    instances: List[ErrorInstance] = field(default_factory=list)


@dataclass
class ErrorPattern:
    """Pattern for error classification."""
    pattern: str
    category: ErrorCategory
    severity: ErrorSeverity
    description: str
    is_regex: bool = False
    auto_resolve: bool = False
    resolution_action: Optional[str] = None


@dataclass
class ErrorSummary:
    """Error summary for a time period."""
    period_start: datetime
    period_end: datetime
    total_errors: int
    unique_errors: int
    critical_errors: int
    new_errors: int
    resolved_errors: int
    error_rate: float
    category_breakdown: Dict[ErrorCategory, int]
    severity_breakdown: Dict[ErrorSeverity, int]
    top_errors: List[ErrorGroup]
    trending_errors: List[ErrorGroup]


class ErrorTrackingSystem:
    """Comprehensive error tracking and debugging system."""
    
    def __init__(self, db_path: Optional[str] = None):
        """Initialize error tracking system."""
        self.logger = get_agent_logger()
        
        # Database setup
        self.db_path = db_path or "database/error_tracking.db"
        self._init_database()
        
        # In-memory storage
        self.error_groups: Dict[str, ErrorGroup] = {}
        self.recent_errors: deque = deque(maxlen=1000)
        self.error_patterns: List[ErrorPattern] = []
        
        # Statistics
        self.error_stats = {
            'total_errors_today': 0,
            'unique_errors_today': 0,
            'critical_errors_today': 0,
            'error_rate_per_hour': 0.0,
            'top_error_categories': {},
            'most_affected_components': {}
        }
        
        # Configuration
        self.max_stack_trace_length = 5000
        self.error_grouping_window = timedelta(hours=1)
        self.auto_resolve_timeout = timedelta(days=7)
        
        # Callbacks
        self.error_callbacks: List[Callable[[ErrorInstance], None]] = []
        self.alert_callbacks: List[Callable[[ErrorGroup], None]] = []
        
        # Threading
        self.tracking_lock = threading.RLock()
        self.cleanup_thread = None
        self.analysis_thread = None
        self.tracking_active = False
        
        # Initialize patterns and start tracking
        self._initialize_error_patterns()
        self._load_error_groups()
        self._start_tracking()
    
    def _init_database(self):
        """Initialize database for error tracking."""
        db_dir = os.path.dirname(self.db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Error groups table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS error_groups (
                    id TEXT PRIMARY KEY,
                    error_hash TEXT UNIQUE NOT NULL,
                    first_seen TEXT NOT NULL,
                    last_seen TEXT NOT NULL,
                    count INTEGER DEFAULT 1,
                    severity TEXT NOT NULL,
                    category TEXT NOT NULL,
                    status TEXT DEFAULT 'new',
                    title TEXT NOT NULL,
                    description TEXT,
                    error_pattern TEXT,
                    stack_trace_pattern TEXT,
                    tags TEXT,
                    affected_components TEXT,
                    affected_users TEXT,
                    affected_organizations TEXT,
                    resolution_notes TEXT,
                    resolved_by TEXT,
                    resolved_at TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Error instances table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS error_instances (
                    id TEXT PRIMARY KEY,
                    error_group_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    message TEXT NOT NULL,
                    stack_trace TEXT,
                    context TEXT,
                    metadata TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (error_group_id) REFERENCES error_groups (id)
                )
            ''')
            
            # Error patterns table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS error_patterns (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pattern TEXT NOT NULL,
                    category TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    description TEXT NOT NULL,
                    is_regex INTEGER DEFAULT 0,
                    auto_resolve INTEGER DEFAULT 0,
                    resolution_action TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create indexes
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_error_groups_hash ON error_groups(error_hash)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_error_groups_last_seen ON error_groups(last_seen)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_error_groups_category ON error_groups(category)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_error_groups_severity ON error_groups(severity)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_error_instances_timestamp ON error_instances(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_error_instances_group ON error_instances(error_group_id)')
            
            conn.commit()
    
    def _initialize_error_patterns(self):
        """Initialize default error patterns."""
        default_patterns = [
            # LLM Provider Errors
            ErrorPattern(
                pattern="rate limit exceeded|too many requests",
                category=ErrorCategory.RATE_LIMIT,
                severity=ErrorSeverity.MEDIUM,
                description="Rate limit exceeded",
                is_regex=True,
                auto_resolve=True,
                resolution_action="retry_with_backoff"
            ),
            ErrorPattern(
                pattern="invalid api key|unauthorized",
                category=ErrorCategory.AUTHENTICATION,
                severity=ErrorSeverity.HIGH,
                description="Authentication failed",
                is_regex=True
            ),
            ErrorPattern(
                pattern="connection timeout|read timeout",
                category=ErrorCategory.TIMEOUT,
                severity=ErrorSeverity.MEDIUM,
                description="Request timeout",
                is_regex=True,
                auto_resolve=True,
                resolution_action="retry"
            ),
            
            # Database Errors
            ErrorPattern(
                pattern="database connection failed|connection refused",
                category=ErrorCategory.DATABASE,
                severity=ErrorSeverity.CRITICAL,
                description="Database connection failed",
                is_regex=True
            ),
            ErrorPattern(
                pattern="deadlock detected|lock timeout",
                category=ErrorCategory.DATABASE,
                severity=ErrorSeverity.MEDIUM,
                description="Database lock issue",
                is_regex=True,
                auto_resolve=True,
                resolution_action="retry_transaction"
            ),
            
            # Agent Execution Errors
            ErrorPattern(
                pattern="tool execution failed|tool not found",
                category=ErrorCategory.TOOL_EXECUTION,
                severity=ErrorSeverity.MEDIUM,
                description="Tool execution error",
                is_regex=True
            ),
            ErrorPattern(
                pattern="agent initialization failed",
                category=ErrorCategory.AGENT_EXECUTION,
                severity=ErrorSeverity.HIGH,
                description="Agent initialization error",
                is_regex=True
            ),
            
            # Validation Errors
            ErrorPattern(
                pattern="validation error|invalid input|schema validation failed",
                category=ErrorCategory.VALIDATION,
                severity=ErrorSeverity.LOW,
                description="Input validation error",
                is_regex=True,
                auto_resolve=True,
                resolution_action="fix_input"
            ),
            
            # Network Errors
            ErrorPattern(
                pattern="network error|connection error|dns resolution failed",
                category=ErrorCategory.NETWORK,
                severity=ErrorSeverity.MEDIUM,
                description="Network connectivity issue",
                is_regex=True,
                auto_resolve=True,
                resolution_action="retry_with_backoff"
            ),
            
            # System Errors
            ErrorPattern(
                pattern="out of memory|memory allocation failed",
                category=ErrorCategory.SYSTEM,
                severity=ErrorSeverity.CRITICAL,
                description="Memory allocation error",
                is_regex=True
            ),
            ErrorPattern(
                pattern="disk space|no space left",
                category=ErrorCategory.SYSTEM,
                severity=ErrorSeverity.CRITICAL,
                description="Disk space error",
                is_regex=True
            )
        ]
        
        # Load patterns from database
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM error_patterns')
                
                db_patterns = []
                for row in cursor.fetchall():
                    pattern = ErrorPattern(
                        pattern=row[1],
                        category=ErrorCategory(row[2]),
                        severity=ErrorSeverity(row[3]),
                        description=row[4],
                        is_regex=bool(row[5]),
                        auto_resolve=bool(row[6]),
                        resolution_action=row[7]
                    )
                    db_patterns.append(pattern)
                
                self.error_patterns = db_patterns if db_patterns else default_patterns
                
                # Store default patterns if database is empty
                if not db_patterns:
                    for pattern in default_patterns:
                        cursor.execute('''
                            INSERT INTO error_patterns (
                                pattern, category, severity, description,
                                is_regex, auto_resolve, resolution_action
                            ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            pattern.pattern,
                            pattern.category.value,
                            pattern.severity.value,
                            pattern.description,
                            1 if pattern.is_regex else 0,
                            1 if pattern.auto_resolve else 0,
                            pattern.resolution_action
                        ))
                    conn.commit()
                    self.error_patterns = default_patterns
        
        except Exception as e:
            self.logger.log_error(
                "Failed to load error patterns",
                error=str(e),
                error_type="initialization_error"
            )
            self.error_patterns = default_patterns
    
    def _start_tracking(self):
        """Start error tracking threads."""
        self.tracking_active = True
        
        # Start cleanup thread
        self.cleanup_thread = threading.Thread(
            target=self._cleanup_loop,
            daemon=True
        )
        self.cleanup_thread.start()
        
        # Start analysis thread
        self.analysis_thread = threading.Thread(
            target=self._analysis_loop,
            daemon=True
        )
        self.analysis_thread.start()
        
        self.logger.log_custom_event(
            "error_tracking_started",
            "Error tracking system started",
            {"component": "error_tracking"}
        )
    
    def track_error(
        self,
        error: Union[Exception, str],
        context: Optional[ErrorContext] = None,
        severity: Optional[ErrorSeverity] = None,
        category: Optional[ErrorCategory] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Track an error occurrence."""
        # Extract error information
        if isinstance(error, Exception):
            error_message = str(error)
            stack_trace = traceback.format_exc()
            error_type = type(error).__name__
        else:
            error_message = str(error)
            stack_trace = None
            error_type = "GenericError"
        
        # Truncate stack trace if too long
        if stack_trace and len(stack_trace) > self.max_stack_trace_length:
            stack_trace = stack_trace[:self.max_stack_trace_length] + "\n... (truncated)"
        
        # Create error context if not provided
        if context is None:
            context = ErrorContext()
        
        # Classify error
        if not category or not severity:
            classified_category, classified_severity = self._classify_error(error_message, stack_trace)
            category = category or classified_category
            severity = severity or classified_severity
        
        # Generate error hash for grouping
        error_hash = self._generate_error_hash(error_message, stack_trace, error_type)
        
        # Create error instance
        instance_id = f"err_{int(time.time() * 1000)}_{hash(error_message) % 10000:04d}"
        instance = ErrorInstance(
            id=instance_id,
            error_group_id="",  # Will be set when adding to group
            timestamp=datetime.now(timezone.utc),
            message=error_message,
            stack_trace=stack_trace,
            context=context,
            metadata=metadata or {}
        )
        
        # Find or create error group
        group = self._find_or_create_error_group(
            error_hash, error_message, stack_trace, category, severity, error_type
        )
        
        # Add instance to group
        instance.error_group_id = group.id
        group.instances.append(instance)
        group.count += 1
        group.last_seen = instance.timestamp
        
        # Update affected entities
        if context.user_id:
            group.affected_users.add(context.user_id)
        if context.organization_id:
            group.affected_organizations.add(context.organization_id)
        if context.component:
            if context.component not in group.affected_components:
                group.affected_components.append(context.component)
        
        # Store in recent errors
        with self.tracking_lock:
            self.recent_errors.append(instance)
            self.error_stats['total_errors_today'] += 1
        
        # Update database
        self._update_error_group_in_db(group)
        self._store_error_instance_in_db(instance)
        
        # Log error
        self.logger.log_error(
            f"Error tracked: {error_message[:100]}",
            error=error_message,
            error_type="tracked_error",
            context={
                "error_group_id": group.id,
                "instance_id": instance_id,
                "category": category.value,
                "severity": severity.value,
                "agent_id": context.agent_id,
                "execution_id": context.execution_id
            }
        )
        
        # Trigger callbacks
        for callback in self.error_callbacks:
            try:
                callback(instance)
            except Exception as e:
                self.logger.log_error(
                    "Error in error tracking callback",
                    error=str(e),
                    error_type="callback_error"
                )
        
        # Check for alerts
        self._check_error_alerts(group)
        
        return instance_id
    
    def _classify_error(self, message: str, stack_trace: Optional[str]) -> tuple[ErrorCategory, ErrorSeverity]:
        """Classify error based on patterns."""
        message_lower = message.lower()
        stack_trace_lower = stack_trace.lower() if stack_trace else ""
        
        for pattern in self.error_patterns:
            text_to_match = message_lower + " " + stack_trace_lower
            
            if pattern.is_regex:
                import re
                if re.search(pattern.pattern.lower(), text_to_match):
                    return pattern.category, pattern.severity
            else:
                if pattern.pattern.lower() in text_to_match:
                    return pattern.category, pattern.severity
        
        # Default classification
        return ErrorCategory.UNKNOWN, ErrorSeverity.MEDIUM
    
    def _generate_error_hash(self, message: str, stack_trace: Optional[str], error_type: str) -> str:
        """Generate hash for error grouping."""
        # Clean message (remove dynamic parts)
        cleaned_message = self._clean_error_message(message)
        
        # Clean stack trace (keep only function names and file paths)
        cleaned_stack = self._clean_stack_trace(stack_trace) if stack_trace else ""
        
        # Combine for hashing
        hash_input = f"{error_type}:{cleaned_message}:{cleaned_stack}"
        return hashlib.md5(hash_input.encode()).hexdigest()[:16]
    
    def _clean_error_message(self, message: str) -> str:
        """Clean error message for grouping."""
        # Remove dynamic parts like timestamps, IDs, numbers
        patterns_to_remove = [
            r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}',  # ISO timestamps
            r'\b\d+\.\d+\.\d+\.\d+\b',  # IP addresses
            r'\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b',  # UUIDs
            r'\b\d{10,}\b',  # Large numbers (timestamps, IDs)
            r"'[^']*'",  # Quoted strings (might contain dynamic content)
            r'"[^"]*"'   # Double quoted strings
        ]
        
        cleaned = message
        for pattern in patterns_to_remove:
            cleaned = re.sub(pattern, '<DYNAMIC>', cleaned, flags=re.IGNORECASE)
        
        return cleaned
    
    def _clean_stack_trace(self, stack_trace: str) -> str:
        """Clean stack trace for grouping."""
        if not stack_trace:
            return ""
        
        # Extract only function names and file paths
        lines = stack_trace.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Keep lines that contain function calls
            if 'File "' in line and 'line' in line:
                # Extract file path and function name
                parts = line.strip().split(', ')
                if len(parts) >= 2:
                    file_part = parts[0].replace('File "', '').replace('"', '')
                    # Keep only the filename, not the full path
                    filename = file_part.split('/')[-1] if '/' in file_part else file_part
                    cleaned_lines.append(filename)
            elif line.strip() and not line.startswith('  '):
                # Keep function/method names
                cleaned_lines.append(line.strip())
        
        return '|'.join(cleaned_lines[:10])  # Limit to top 10 stack frames
    
    def _find_or_create_error_group(
        self,
        error_hash: str,
        message: str,
        stack_trace: Optional[str],
        category: ErrorCategory,
        severity: ErrorSeverity,
        error_type: str
    ) -> ErrorGroup:
        """Find existing error group or create new one."""
        with self.tracking_lock:
            # Check existing groups
            for group in self.error_groups.values():
                if group.error_hash == error_hash:
                    # Update severity if this error is more severe
                    if severity.value in ['critical', 'fatal'] and group.severity.value not in ['critical', 'fatal']:
                        group.severity = severity
                    return group
            
            # Create new group
            group_id = f"grp_{error_hash}_{int(time.time())}"
            
            # Generate title
            title = self._generate_error_title(message, error_type, category)
            
            group = ErrorGroup(
                id=group_id,
                error_hash=error_hash,
                first_seen=datetime.now(timezone.utc),
                last_seen=datetime.now(timezone.utc),
                count=0,
                severity=severity,
                category=category,
                status=ErrorStatus.NEW,
                title=title,
                description=message[:500],  # Truncate description
                error_pattern=self._extract_error_pattern(message),
                stack_trace_pattern=self._extract_stack_pattern(stack_trace)
            )
            
            self.error_groups[group_id] = group
            self.error_stats['unique_errors_today'] += 1
            
            return group
    
    def _generate_error_title(self, message: str, error_type: str, category: ErrorCategory) -> str:
        """Generate a descriptive title for the error group."""
        # Take first meaningful part of the message
        title_parts = []
        
        if category != ErrorCategory.UNKNOWN:
            title_parts.append(category.value.replace('_', ' ').title())
        
        title_parts.append(error_type)
        
        # Add first sentence or first 50 characters of message
        first_sentence = message.split('.')[0].strip()
        if len(first_sentence) > 50:
            first_sentence = first_sentence[:50] + "..."
        
        if first_sentence:
            title_parts.append(first_sentence)
        
        return " - ".join(title_parts)
    
    def _extract_error_pattern(self, message: str) -> str:
        """Extract a pattern from error message."""
        # Simple pattern extraction - remove dynamic parts
        pattern = self._clean_error_message(message)
        return pattern[:200]  # Limit length
    
    def _extract_stack_pattern(self, stack_trace: Optional[str]) -> Optional[str]:
        """Extract a pattern from stack trace."""
        if not stack_trace:
            return None
        
        # Get the last few stack frames (where the error actually occurred)
        lines = stack_trace.split('\n')
        relevant_lines = [line for line in lines if 'File "' in line]
        
        if relevant_lines:
            # Take last 3 stack frames
            return '\n'.join(relevant_lines[-3:])
        
        return None
    
    def get_error_group(self, group_id: str) -> Optional[ErrorGroup]:
        """Get error group by ID."""
        with self.tracking_lock:
            return self.error_groups.get(group_id)
    
    def get_error_summary(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        organization_id: Optional[str] = None
    ) -> ErrorSummary:
        """Get error summary for a time period."""
        end_time = end_time or datetime.now(timezone.utc)
        start_time = start_time or (end_time - timedelta(hours=24))
        
        # Filter errors by time range and organization
        relevant_errors = []
        
        with self.tracking_lock:
            for error in self.recent_errors:
                if start_time <= error.timestamp <= end_time:
                    if organization_id and error.context.organization_id != organization_id:
                        continue
                    relevant_errors.append(error)
        
        # Calculate statistics
        total_errors = len(relevant_errors)
        
        # Get unique groups
        unique_groups = set(error.error_group_id for error in relevant_errors)
        unique_errors = len(unique_groups)
        
        # Count by severity and category
        severity_counts = defaultdict(int)
        category_counts = defaultdict(int)
        critical_errors = 0
        
        for error in relevant_errors:
            group = self.error_groups.get(error.error_group_id)
            if group:
                severity_counts[group.severity] += 1
                category_counts[group.category] += 1
                
                if group.severity in [ErrorSeverity.CRITICAL, ErrorSeverity.FATAL]:
                    critical_errors += 1
        
        # Get new and resolved errors
        new_errors = len([g for g in self.error_groups.values() 
                         if g.status == ErrorStatus.NEW and start_time <= g.first_seen <= end_time])
        resolved_errors = len([g for g in self.error_groups.values() 
                              if g.status == ErrorStatus.RESOLVED and g.resolved_at and 
                              start_time <= g.resolved_at <= end_time])
        
        # Calculate error rate
        time_range_hours = (end_time - start_time).total_seconds() / 3600
        error_rate = total_errors / time_range_hours if time_range_hours > 0 else 0
        
        # Get top errors (by count)
        top_groups = sorted(
            [g for g in self.error_groups.values() if g.id in unique_groups],
            key=lambda x: x.count,
            reverse=True
        )[:10]
        
        # Get trending errors (recent increase in frequency)
        trending_groups = self._get_trending_errors(start_time, end_time)[:5]
        
        return ErrorSummary(
            period_start=start_time,
            period_end=end_time,
            total_errors=total_errors,
            unique_errors=unique_errors,
            critical_errors=critical_errors,
            new_errors=new_errors,
            resolved_errors=resolved_errors,
            error_rate=error_rate,
            category_breakdown=dict(category_counts),
            severity_breakdown=dict(severity_counts),
            top_errors=top_groups,
            trending_errors=trending_groups
        )
    
    def resolve_error_group(
        self,
        group_id: str,
        resolved_by: str,
        resolution_notes: Optional[str] = None
    ) -> bool:
        """Resolve an error group."""
        with self.tracking_lock:
            if group_id not in self.error_groups:
                return False
            
            group = self.error_groups[group_id]
            group.status = ErrorStatus.RESOLVED
            group.resolved_by = resolved_by
            group.resolved_at = datetime.now(timezone.utc)
            group.resolution_notes = resolution_notes
            
            # Update in database
            self._update_error_group_in_db(group)
            
            self.logger.log_custom_event(
                "error_group_resolved",
                f"Error group resolved: {group.title}",
                {
                    "group_id": group_id,
                    "resolved_by": resolved_by,
                    "resolution_notes": resolution_notes
                }
            )
            
            return True
    
    def ignore_error_group(self, group_id: str, ignored_by: str) -> bool:
        """Ignore an error group."""
        with self.tracking_lock:
            if group_id not in self.error_groups:
                return False
            
            group = self.error_groups[group_id]
            group.status = ErrorStatus.IGNORED
            
            # Update in database
            self._update_error_group_in_db(group)
            
            self.logger.log_custom_event(
                "error_group_ignored",
                f"Error group ignored: {group.title}",
                {
                    "group_id": group_id,
                    "ignored_by": ignored_by
                }
            )
            
            return True
    
    def add_error_callback(self, callback: Callable[[ErrorInstance], None]):
        """Add callback for error events."""
        self.error_callbacks.append(callback)
    
    def add_alert_callback(self, callback: Callable[[ErrorGroup], None]):
        """Add callback for error alerts."""
        self.alert_callbacks.append(callback)
    
    def _get_trending_errors(self, start_time: datetime, end_time: datetime) -> List[ErrorGroup]:
        """Get errors that are trending (increasing frequency)."""
        # Simple trending calculation - compare recent vs previous period
        period_duration = end_time - start_time
        previous_start = start_time - period_duration
        
        group_counts = defaultdict(lambda: {'recent': 0, 'previous': 0})
        
        with self.tracking_lock:
            for error in self.recent_errors:
                if previous_start <= error.timestamp <= end_time:
                    if start_time <= error.timestamp <= end_time:
                        group_counts[error.error_group_id]['recent'] += 1
                    else:
                        group_counts[error.error_group_id]['previous'] += 1
        
        # Calculate trending score
        trending_groups = []
        for group_id, counts in group_counts.items():
            if group_id in self.error_groups:
                group = self.error_groups[group_id]
                recent = counts['recent']
                previous = counts['previous']
                
                # Trending score: recent count + growth rate
                if previous > 0:
                    growth_rate = (recent - previous) / previous
                    trending_score = recent + (growth_rate * 10)
                else:
                    trending_score = recent
                
                if trending_score > 0:
                    # Add trending score as temporary attribute
                    group.trending_score = trending_score
                    trending_groups.append(group)
        
        # Sort by trending score
        trending_groups.sort(key=lambda x: getattr(x, 'trending_score', 0), reverse=True)
        
        return trending_groups
    
    def _check_error_alerts(self, group: ErrorGroup):
        """Check if error group should trigger an alert."""
        should_alert = False
        alert_reason = ""
        
        # Alert on new critical/fatal errors
        if group.status == ErrorStatus.NEW and group.severity in [ErrorSeverity.CRITICAL, ErrorSeverity.FATAL]:
            should_alert = True
            alert_reason = f"New {group.severity.value} error"
        
        # Alert on error spike (more than 10 occurrences in 10 minutes)
        elif group.count >= 10:
            recent_count = sum(
                1 for instance in group.instances
                if instance.timestamp >= datetime.now(timezone.utc) - timedelta(minutes=10)
            )
            if recent_count >= 10:
                should_alert = True
                alert_reason = f"Error spike: {recent_count} occurrences in 10 minutes"
        
        # Trigger alert callbacks
        if should_alert:
            for callback in self.alert_callbacks:
                try:
                    callback(group)
                except Exception as e:
                    self.logger.log_error(
                        "Error in alert callback",
                        error=str(e),
                        error_type="callback_error"
                    )
            
            self.logger.log_custom_event(
                "error_alert_triggered",
                f"Error alert: {alert_reason}",
                {
                    "group_id": group.id,
                    "title": group.title,
                    "severity": group.severity.value,
                    "count": group.count,
                    "reason": alert_reason
                }
            )
    
    def _load_error_groups(self):
        """Load error groups from database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT * FROM error_groups 
                    WHERE last_seen >= ? 
                    ORDER BY last_seen DESC
                ''', ((datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),))
                
                for row in cursor.fetchall():
                    group = ErrorGroup(
                        id=row[0],
                        error_hash=row[1],
                        first_seen=datetime.fromisoformat(row[2]),
                        last_seen=datetime.fromisoformat(row[3]),
                        count=row[4],
                        severity=ErrorSeverity(row[5]),
                        category=ErrorCategory(row[6]),
                        status=ErrorStatus(row[7]),
                        title=row[8],
                        description=row[9] or "",
                        error_pattern=row[10] or "",
                        stack_trace_pattern=row[11],
                        tags=json.loads(row[12] or '[]'),
                        affected_components=json.loads(row[13] or '[]'),
                        affected_users=set(json.loads(row[14] or '[]')),
                        affected_organizations=set(json.loads(row[15] or '[]')),
                        resolution_notes=row[16],
                        resolved_by=row[17],
                        resolved_at=datetime.fromisoformat(row[18]) if row[18] else None
                    )
                    self.error_groups[group.id] = group
        
        except Exception as e:
            self.logger.log_error(
                "Failed to load error groups",
                error=str(e),
                error_type="database_error"
            )
    
    def _update_error_group_in_db(self, group: ErrorGroup):
        """Update error group in database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT OR REPLACE INTO error_groups (
                        id, error_hash, first_seen, last_seen, count,
                        severity, category, status, title, description,
                        error_pattern, stack_trace_pattern, tags,
                        affected_components, affected_users, affected_organizations,
                        resolution_notes, resolved_by, resolved_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    group.id,
                    group.error_hash,
                    group.first_seen.isoformat(),
                    group.last_seen.isoformat(),
                    group.count,
                    group.severity.value,
                    group.category.value,
                    group.status.value,
                    group.title,
                    group.description,
                    group.error_pattern,
                    group.stack_trace_pattern,
                    json.dumps(group.tags),
                    json.dumps(group.affected_components),
                    json.dumps(list(group.affected_users)),
                    json.dumps(list(group.affected_organizations)),
                    group.resolution_notes,
                    group.resolved_by,
                    group.resolved_at.isoformat() if group.resolved_at else None,
                    datetime.now(timezone.utc).isoformat()
                ))
                conn.commit()
        except Exception as e:
            self.logger.log_error(
                "Failed to update error group",
                error=str(e),
                error_type="database_error"
            )
    
    def _store_error_instance_in_db(self, instance: ErrorInstance):
        """Store error instance in database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO error_instances (
                        id, error_group_id, timestamp, message,
                        stack_trace, context, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    instance.id,
                    instance.error_group_id,
                    instance.timestamp.isoformat(),
                    instance.message,
                    instance.stack_trace,
                    json.dumps({
                        'agent_id': instance.context.agent_id,
                        'execution_id': instance.context.execution_id,
                        'user_id': instance.context.user_id,
                        'organization_id': instance.context.organization_id,
                        'component': instance.context.component,
                        'function_name': instance.context.function_name,
                        'request_id': instance.context.request_id,
                        'session_id': instance.context.session_id,
                        'additional_data': instance.context.additional_data
                    }),
                    json.dumps(instance.metadata)
                ))
                conn.commit()
        except Exception as e:
            self.logger.log_error(
                "Failed to store error instance",
                error=str(e),
                error_type="database_error"
            )
    
    def _cleanup_loop(self):
        """Cleanup old errors periodically."""
        while self.tracking_active:
            try:
                # Clean up old error instances (older than 30 days)
                cutoff_time = datetime.now(timezone.utc) - timedelta(days=30)
                
                with sqlite3.connect(self.db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        'DELETE FROM error_instances WHERE timestamp < ?',
                        (cutoff_time.isoformat(),)
                    )
                    
                    # Clean up resolved error groups (older than 7 days)
                    resolved_cutoff = datetime.now(timezone.utc) - timedelta(days=7)
                    cursor.execute('''
                        DELETE FROM error_groups 
                        WHERE status = 'resolved' AND resolved_at < ?
                    ''', (resolved_cutoff.isoformat(),))
                    
                    conn.commit()
                
                # Reset daily stats at midnight
                now = datetime.now(timezone.utc)
                if now.hour == 0 and now.minute < 5:
                    with self.tracking_lock:
                        self.error_stats['total_errors_today'] = 0
                        self.error_stats['unique_errors_today'] = 0
                        self.error_stats['critical_errors_today'] = 0
                
                # Sleep for 1 hour
                time.sleep(3600)
                
            except Exception as e:
                self.logger.log_error(
                    "Error in cleanup loop",
                    error=str(e),
                    error_type="monitoring_error"
                )
                time.sleep(3600)
    
    def _analysis_loop(self):
        """Analyze error patterns periodically."""
        while self.tracking_active:
            try:
                # Update error statistics
                self._update_error_statistics()
                
                # Sleep for 5 minutes
                time.sleep(300)
                
            except Exception as e:
                self.logger.log_error(
                    "Error in analysis loop",
                    error=str(e),
                    error_type="monitoring_error"
                )
                time.sleep(300)
    
    def _update_error_statistics(self):
        """Update error statistics."""
        with self.tracking_lock:
            # Calculate error rate per hour
            one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
            recent_errors = [e for e in self.recent_errors if e.timestamp >= one_hour_ago]
            self.error_stats['error_rate_per_hour'] = len(recent_errors)
            
            # Calculate category breakdown
            category_counts = defaultdict(int)
            component_counts = defaultdict(int)
            
            for group in self.error_groups.values():
                if group.last_seen >= one_hour_ago:
                    category_counts[group.category.value] += group.count
                    
                    for component in group.affected_components:
                        component_counts[component] += group.count
            
            self.error_stats['top_error_categories'] = dict(
                sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            )
            self.error_stats['most_affected_components'] = dict(
                sorted(component_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            )
    
    def stop_tracking(self):
        """Stop error tracking."""
        self.tracking_active = False
        
        if self.cleanup_thread and self.cleanup_thread.is_alive():
            self.cleanup_thread.join(timeout=5)
        
        if self.analysis_thread and self.analysis_thread.is_alive():
            self.analysis_thread.join(timeout=5)
        
        self.logger.log_custom_event(
            "error_tracking_stopped",
            "Error tracking system stopped",
            {"component": "error_tracking"}
        )


# Global instance
_error_tracking_system = None

def get_error_tracking_system() -> ErrorTrackingSystem:
    """Get global error tracking system instance."""
    global _error_tracking_system
    if _error_tracking_system is None:
        _error_tracking_system = ErrorTrackingSystem()
    return _error_tracking_system