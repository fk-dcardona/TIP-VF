"""Permission system for agent protocol security."""

import json
import threading
from typing import Dict, List, Set, Optional, Any, Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from functools import wraps

from ..monitoring.agent_logger import get_agent_logger


class PermissionLevel(Enum):
    """Permission levels for resource access."""
    NONE = "none"
    READ = "read"
    WRITE = "write"
    EXECUTE = "execute"
    ADMIN = "admin"


class ResourceType(Enum):
    """Types of resources that can be protected."""
    DATABASE = "database"
    API = "api"
    FILE = "file"
    TOOL = "tool"
    PROMPT = "prompt"
    SYSTEM = "system"


@dataclass
class Permission:
    """Individual permission definition."""
    resource_type: ResourceType
    resource_id: str
    level: PermissionLevel
    conditions: Dict[str, Any] = field(default_factory=dict)
    expires_at: Optional[datetime] = None
    granted_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    granted_by: Optional[str] = None
    
    def is_valid(self) -> bool:
        """Check if permission is still valid."""
        if self.expires_at and datetime.now(timezone.utc) > self.expires_at:
            return False
        return True
    
    def allows_level(self, required_level: PermissionLevel) -> bool:
        """Check if this permission allows the required level."""
        level_hierarchy = {
            PermissionLevel.NONE: 0,
            PermissionLevel.READ: 1,
            PermissionLevel.WRITE: 2,
            PermissionLevel.EXECUTE: 3,
            PermissionLevel.ADMIN: 4
        }
        
        return level_hierarchy[self.level] >= level_hierarchy[required_level]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "resource_type": self.resource_type.value,
            "resource_id": self.resource_id,
            "level": self.level.value,
            "conditions": self.conditions,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "granted_at": self.granted_at.isoformat(),
            "granted_by": self.granted_by
        }


@dataclass
class SecurityContext:
    """Security context for agent operations."""
    agent_id: str
    user_id: str
    org_id: str
    session_id: str
    permissions: List[Permission] = field(default_factory=list)
    restrictions: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    def has_permission(self, resource_type: ResourceType, resource_id: str, 
                      level: PermissionLevel) -> bool:
        """Check if context has required permission."""
        for permission in self.permissions:
            if permission.resource_type != resource_type:
                continue
                
            if not permission.is_valid():
                continue
                
            if not permission.allows_level(level):
                continue
            
            # Check resource ID match with wildcard support
            perm_resource = permission.resource_id
            if perm_resource == resource_id:
                return True
            elif perm_resource == "*":
                return True
            elif perm_resource.endswith("_*"):
                # Check prefix match for org-scoped wildcards
                prefix = perm_resource[:-2]  # Remove _*
                if resource_id.startswith(prefix + "_"):
                    return True
            elif "*" in perm_resource:
                # General wildcard matching
                import fnmatch
                if fnmatch.fnmatch(resource_id, perm_resource):
                    return True
        
        return False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "agent_id": self.agent_id,
            "user_id": self.user_id,
            "org_id": self.org_id,
            "session_id": self.session_id,
            "permissions": [p.to_dict() for p in self.permissions],
            "restrictions": self.restrictions,
            "created_at": self.created_at.isoformat()
        }


class PermissionManager:
    """Manager for agent permissions and security policies."""
    
    def __init__(self):
        """Initialize permission manager."""
        self.logger = get_agent_logger()
        
        # Permission storage
        self._contexts: Dict[str, SecurityContext] = {}
        self._role_permissions: Dict[str, List[Permission]] = {}
        self._security_policies: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.RLock()
        
        # Initialize default roles and policies
        self._initialize_default_roles()
        self._initialize_security_policies()
    
    def _initialize_default_roles(self):
        """Initialize default role-based permissions."""
        # Note: These are templates. Actual permissions will be org-scoped when assigned
        default_roles = {
            "agent_operator": [
                Permission(ResourceType.DATABASE, "{{org_id}}_*", PermissionLevel.READ),
                Permission(ResourceType.API, "external_{{org_id}}_*", PermissionLevel.EXECUTE),
                Permission(ResourceType.TOOL, "agent_{{org_id}}_*", PermissionLevel.EXECUTE),
                Permission(ResourceType.PROMPT, "{{org_id}}_*", PermissionLevel.READ),
            ],
            "agent_admin": [
                Permission(ResourceType.DATABASE, "{{org_id}}_*", PermissionLevel.WRITE),
                Permission(ResourceType.API, "{{org_id}}_*", PermissionLevel.EXECUTE),
                Permission(ResourceType.TOOL, "agent_{{org_id}}_*", PermissionLevel.ADMIN),
                Permission(ResourceType.PROMPT, "{{org_id}}_*", PermissionLevel.WRITE),
                Permission(ResourceType.SYSTEM, "{{org_id}}_config", PermissionLevel.READ),
            ],
            "agent_viewer": [
                Permission(ResourceType.DATABASE, "{{org_id}}_*", PermissionLevel.READ),
                Permission(ResourceType.PROMPT, "{{org_id}}_*", PermissionLevel.READ),
            ]
        }
        
        with self._lock:
            self._role_permissions = default_roles
    
    def _initialize_security_policies(self):
        """Initialize security policies."""
        policies = {
            "default": {
                "max_execution_time": 300,  # 5 minutes
                "max_api_calls": 100,
                "allowed_domains": ["api.example.com", "data.supply-chain.com"],
                "blocked_domains": ["malicious.com"],
                "max_file_size": 10 * 1024 * 1024,  # 10MB
                "allowed_file_types": [".json", ".csv", ".txt", ".xml"],
                "rate_limits": {
                    "api_calls_per_minute": 60,
                    "database_queries_per_minute": 30
                }
            },
            "restricted": {
                "max_execution_time": 60,  # 1 minute
                "max_api_calls": 10,
                "allowed_domains": ["api.example.com"],
                "blocked_domains": [],
                "max_file_size": 1 * 1024 * 1024,  # 1MB
                "allowed_file_types": [".json", ".txt"],
                "rate_limits": {
                    "api_calls_per_minute": 10,
                    "database_queries_per_minute": 5
                }
            }
        }
        
        with self._lock:
            self._security_policies = policies
    
    def create_security_context(self, agent_id: str, user_id: str, org_id: str,
                               session_id: str, role: str = "agent_operator") -> SecurityContext:
        """Create security context for agent execution."""
        # Get role permissions and apply org-scoping
        role_permissions = []
        with self._lock:
            if role in self._role_permissions:
                # Apply org-specific scoping to permissions
                for perm_template in self._role_permissions[role]:
                    # Replace {{org_id}} placeholder with actual org_id
                    resource_id = perm_template.resource_id.replace("{{org_id}}", org_id)
                    
                    # Create org-scoped permission
                    org_permission = Permission(
                        resource_type=perm_template.resource_type,
                        resource_id=resource_id,
                        level=perm_template.level,
                        conditions={"org_id": org_id},
                        granted_by="system"
                    )
                    role_permissions.append(org_permission)
        
        # Create context
        context = SecurityContext(
            agent_id=agent_id,
            user_id=user_id,
            org_id=org_id,
            session_id=session_id,
            permissions=role_permissions,
            restrictions=self._security_policies.get("default", {}).copy()
        )
        
        with self._lock:
            self._contexts[session_id] = context
        
        self.logger.log_custom_event(
            "security_context_created",
            f"Security context created for agent {agent_id}",
            {
                "agent_id": agent_id,
                "user_id": user_id,
                "org_id": org_id,
                "role": role,
                "permissions_count": len(role_permissions)
            }
        )
        
        return context
    
    def get_security_context(self, session_id: str) -> Optional[SecurityContext]:
        """Get security context by session ID."""
        with self._lock:
            return self._contexts.get(session_id)
    
    def check_permission(self, session_id: str, resource_type: ResourceType,
                        resource_id: str, level: PermissionLevel) -> bool:
        """Check if session has permission for resource."""
        context = self.get_security_context(session_id)
        if not context:
            return False
        
        has_permission = context.has_permission(resource_type, resource_id, level)
        
        # Log permission check
        self.logger.log_custom_event(
            "permission_check",
            f"Permission check: {resource_type.value}:{resource_id} level {level.value}",
            {
                "session_id": session_id,
                "agent_id": context.agent_id,
                "resource_type": resource_type.value,
                "resource_id": resource_id,
                "level": level.value,
                "granted": has_permission
            }
        )
        
        return has_permission
    
    def grant_permission(self, session_id: str, permission: Permission) -> bool:
        """Grant additional permission to session."""
        with self._lock:
            context = self._contexts.get(session_id)
            if not context:
                return False
            
            context.permissions.append(permission)
        
        self.logger.log_custom_event(
            "permission_granted",
            f"Permission granted: {permission.resource_type.value}:{permission.resource_id}",
            {
                "session_id": session_id,
                "permission": permission.to_dict()
            }
        )
        
        return True
    
    def revoke_permission(self, session_id: str, resource_type: ResourceType,
                         resource_id: str) -> bool:
        """Revoke permission from session."""
        with self._lock:
            context = self._contexts.get(session_id)
            if not context:
                return False
            
            original_count = len(context.permissions)
            context.permissions = [
                p for p in context.permissions
                if not (p.resource_type == resource_type and p.resource_id == resource_id)
            ]
            
            revoked_count = original_count - len(context.permissions)
        
        if revoked_count > 0:
            self.logger.log_custom_event(
                "permission_revoked",
                f"Permission revoked: {resource_type.value}:{resource_id}",
                {
                    "session_id": session_id,
                    "revoked_count": revoked_count
                }
            )
        
        return revoked_count > 0
    
    def apply_security_policy(self, session_id: str, policy_name: str) -> bool:
        """Apply security policy to session."""
        with self._lock:
            context = self._contexts.get(session_id)
            if not context:
                return False
            
            policy = self._security_policies.get(policy_name)
            if not policy:
                return False
            
            context.restrictions.update(policy)
        
        self.logger.log_custom_event(
            "security_policy_applied",
            f"Security policy '{policy_name}' applied to session",
            {
                "session_id": session_id,
                "policy_name": policy_name
            }
        )
        
        return True
    
    def cleanup_expired_contexts(self) -> int:
        """Clean up expired security contexts."""
        current_time = datetime.now(timezone.utc)
        expired_sessions = []
        
        with self._lock:
            for session_id, context in self._contexts.items():
                # Remove contexts older than 24 hours
                if (current_time - context.created_at).total_seconds() > 24 * 3600:
                    expired_sessions.append(session_id)
                else:
                    # Clean up expired permissions
                    context.permissions = [
                        p for p in context.permissions if p.is_valid()
                    ]
            
            for session_id in expired_sessions:
                del self._contexts[session_id]
        
        if expired_sessions:
            self.logger.log_custom_event(
                "security_cleanup",
                f"Cleaned up {len(expired_sessions)} expired security contexts",
                {"expired_count": len(expired_sessions)}
            )
        
        return len(expired_sessions)
    
    def get_security_stats(self) -> Dict[str, Any]:
        """Get security system statistics."""
        with self._lock:
            total_contexts = len(self._contexts)
            permission_counts = {}
            
            for context in self._contexts.values():
                for permission in context.permissions:
                    key = f"{permission.resource_type.value}:{permission.level.value}"
                    permission_counts[key] = permission_counts.get(key, 0) + 1
        
        return {
            "active_contexts": total_contexts,
            "total_roles": len(self._role_permissions),
            "security_policies": len(self._security_policies),
            "permission_distribution": permission_counts
        }


def requires_permission(resource_type: ResourceType, resource_id: str, 
                       level: PermissionLevel):
    """Decorator for enforcing permission requirements."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract session_id from arguments or context
            session_id = kwargs.get('session_id')
            if not session_id and args:
                # Try to find SecurityContext in arguments
                for arg in args:
                    if isinstance(arg, SecurityContext):
                        session_id = arg.session_id
                        break
            
            if not session_id:
                raise PermissionError("No security context found")
            
            permission_manager = get_permission_manager()
            if not permission_manager.check_permission(session_id, resource_type, resource_id, level):
                raise PermissionError(
                    f"Permission denied: {resource_type.value}:{resource_id} level {level.value}"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


# Global permission manager instance
_permission_manager = None

def get_permission_manager() -> PermissionManager:
    """Get global permission manager instance."""
    global _permission_manager
    if _permission_manager is None:
        _permission_manager = PermissionManager()
    return _permission_manager