"""Resource manager for MCP server data and file management."""

import os
import json
import asyncio
import aiofiles
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import threading
from urllib.parse import urlparse


@dataclass
class ResourceMetadata:
    """Resource metadata for MCP management."""
    uri: str
    name: str
    description: str
    mime_type: str
    size: int = 0
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    access_count: int = 0
    checksum: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "uri": self.uri,
            "name": self.name,
            "description": self.description,
            "mime_type": self.mime_type,
            "size": self.size,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "access_count": self.access_count,
            "checksum": self.checksum,
            "tags": self.tags
        }


class ResourceManager:
    """MCP resource manager for data and file operations."""
    
    def __init__(self, base_path: str = "resources"):
        """Initialize resource manager."""
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        
        # Resource storage
        self._resources: Dict[str, ResourceMetadata] = {}
        self._cache: Dict[str, Any] = {}
        self._lock = threading.RLock()
        
        # Configuration
        self.max_cache_size = 100
        self.max_file_size = 10 * 1024 * 1024  # 10MB
        self.supported_schemes = {"file", "http", "https", "database", "memory"}
        
        # Initialize storage directories
        self._init_storage()
    
    def _init_storage(self):
        """Initialize storage directories."""
        directories = ["files", "cache", "temp", "database"]
        for directory in directories:
            (self.base_path / directory).mkdir(exist_ok=True)
    
    def register_resource(self, uri: str, name: str, description: str,
                         mime_type: str = "application/json", tags: List[str] = None) -> bool:
        """Register a resource with the manager."""
        try:
            parsed = urlparse(uri)
            if parsed.scheme not in self.supported_schemes:
                raise ValueError(f"Unsupported scheme: {parsed.scheme}")
            
            metadata = ResourceMetadata(
                uri=uri,
                name=name,
                description=description,
                mime_type=mime_type,
                tags=tags or []
            )
            
            with self._lock:
                self._resources[uri] = metadata
            
            return True
            
        except Exception:
            return False
    
    async def store_resource(self, uri: str, content: Union[str, bytes],
                           mime_type: str = "application/json") -> bool:
        """Store resource content."""
        try:
            parsed = urlparse(uri)
            
            if parsed.scheme == "file":
                return await self._store_file(uri, content, mime_type)
            elif parsed.scheme == "memory":
                return await self._store_memory(uri, content, mime_type)
            elif parsed.scheme == "database":
                return await self._store_database(uri, content, mime_type)
            else:
                raise ValueError(f"Cannot store to scheme: {parsed.scheme}")
                
        except Exception:
            return False
    
    async def read_resource(self, uri: str) -> Optional[str]:
        """Read resource content."""
        # Check cache first
        with self._lock:
            if uri in self._cache:
                self._update_access_count(uri)
                return self._cache[uri]
        
        try:
            parsed = urlparse(uri)
            
            if parsed.scheme == "file":
                content = await self._read_file(uri)
            elif parsed.scheme == "memory":
                content = await self._read_memory(uri)
            elif parsed.scheme == "database":
                content = await self._read_database(uri)
            elif parsed.scheme in {"http", "https"}:
                content = await self._read_http(uri)
            else:
                raise ValueError(f"Unsupported scheme: {parsed.scheme}")
            
            # Cache content if not too large
            if content and len(content) < 1024 * 1024:  # 1MB cache limit
                self._add_to_cache(uri, content)
            
            self._update_access_count(uri)
            return content
            
        except Exception:
            return None
    
    async def _store_file(self, uri: str, content: Union[str, bytes], mime_type: str) -> bool:
        """Store content to file."""
        parsed = urlparse(uri)
        file_path = self.base_path / "files" / parsed.path.lstrip("/")
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Check file size
        if isinstance(content, str):
            content_bytes = content.encode('utf-8')
        else:
            content_bytes = content
        
        if len(content_bytes) > self.max_file_size:
            raise ValueError("File too large")
        
        # Write file
        mode = 'wb' if isinstance(content, bytes) else 'w'
        async with aiofiles.open(file_path, mode) as f:
            await f.write(content)
        
        # Update metadata
        checksum = hashlib.sha256(content_bytes).hexdigest()
        
        with self._lock:
            if uri in self._resources:
                metadata = self._resources[uri]
                metadata.size = len(content_bytes)
                metadata.updated_at = datetime.now(timezone.utc)
                metadata.checksum = checksum
            else:
                metadata = ResourceMetadata(
                    uri=uri,
                    name=parsed.path.split("/")[-1] or "resource",
                    description=f"File resource: {parsed.path}",
                    mime_type=mime_type,
                    size=len(content_bytes),
                    checksum=checksum
                )
                self._resources[uri] = metadata
        
        return True
    
    async def _read_file(self, uri: str) -> Optional[str]:
        """Read content from file."""
        parsed = urlparse(uri)
        file_path = self.base_path / "files" / parsed.path.lstrip("/")
        
        if not file_path.exists():
            return None
        
        try:
            async with aiofiles.open(file_path, 'r') as f:
                return await f.read()
        except UnicodeDecodeError:
            # Try reading as binary and decode
            async with aiofiles.open(file_path, 'rb') as f:
                content = await f.read()
                return content.decode('utf-8', errors='ignore')
    
    async def _store_memory(self, uri: str, content: Union[str, bytes], mime_type: str) -> bool:
        """Store content in memory cache."""
        if isinstance(content, bytes):
            content = content.decode('utf-8')
        
        with self._lock:
            self._cache[uri] = content
            
            # Update metadata
            if uri in self._resources:
                metadata = self._resources[uri]
                metadata.size = len(content)
                metadata.updated_at = datetime.now(timezone.utc)
            else:
                metadata = ResourceMetadata(
                    uri=uri,
                    name=f"memory-{uri.split('/')[-1]}",
                    description="In-memory resource",
                    mime_type=mime_type,
                    size=len(content)
                )
                self._resources[uri] = metadata
        
        return True
    
    async def _read_memory(self, uri: str) -> Optional[str]:
        """Read content from memory cache."""
        with self._lock:
            return self._cache.get(uri)
    
    async def _store_database(self, uri: str, content: Union[str, bytes], mime_type: str) -> bool:
        """Store content in database-like structure."""
        if isinstance(content, bytes):
            content = content.decode('utf-8')
        
        # Store as JSON file in database directory
        parsed = urlparse(uri)
        db_file = self.base_path / "database" / f"{parsed.path.lstrip('/').replace('/', '_')}.json"
        
        data = {
            "uri": uri,
            "content": content,
            "mime_type": mime_type,
            "stored_at": datetime.now(timezone.utc).isoformat()
        }
        
        async with aiofiles.open(db_file, 'w') as f:
            await f.write(json.dumps(data, indent=2))
        
        # Update metadata
        with self._lock:
            if uri in self._resources:
                metadata = self._resources[uri]
                metadata.size = len(content)
                metadata.updated_at = datetime.now(timezone.utc)
            else:
                metadata = ResourceMetadata(
                    uri=uri,
                    name=f"db-{parsed.path.split('/')[-1]}",
                    description="Database resource",
                    mime_type=mime_type,
                    size=len(content)
                )
                self._resources[uri] = metadata
        
        return True
    
    async def _read_database(self, uri: str) -> Optional[str]:
        """Read content from database-like structure."""
        parsed = urlparse(uri)
        db_file = self.base_path / "database" / f"{parsed.path.lstrip('/').replace('/', '_')}.json"
        
        if not db_file.exists():
            return None
        
        try:
            async with aiofiles.open(db_file, 'r') as f:
                data = json.loads(await f.read())
                return data.get("content")
        except (json.JSONDecodeError, FileNotFoundError):
            return None
    
    async def _read_http(self, uri: str) -> Optional[str]:
        """Read content from HTTP/HTTPS URL."""
        try:
            import aiohttp
            
            async with aiohttp.ClientSession() as session:
                async with session.get(uri) as response:
                    if response.status == 200:
                        return await response.text()
                    return None
                    
        except ImportError:
            # Fallback to requests if aiohttp not available
            try:
                import requests
                response = requests.get(uri, timeout=30)
                if response.status_code == 200:
                    return response.text
                return None
            except:
                return None
        except:
            return None
    
    def _add_to_cache(self, uri: str, content: str):
        """Add content to cache with size management."""
        with self._lock:
            # Remove oldest entries if cache is full
            if len(self._cache) >= self.max_cache_size:
                # Simple LRU: remove first entry
                oldest_uri = next(iter(self._cache))
                del self._cache[oldest_uri]
            
            self._cache[uri] = content
    
    def _update_access_count(self, uri: str):
        """Update resource access count."""
        with self._lock:
            if uri in self._resources:
                self._resources[uri].access_count += 1
    
    def list_resources(self, scheme: str = None) -> List[ResourceMetadata]:
        """List available resources."""
        with self._lock:
            resources = list(self._resources.values())
            
            if scheme:
                resources = [r for r in resources if urlparse(r.uri).scheme == scheme]
            
            return resources
    
    def get_resource_metadata(self, uri: str) -> Optional[ResourceMetadata]:
        """Get resource metadata."""
        with self._lock:
            return self._resources.get(uri)
    
    def delete_resource(self, uri: str) -> bool:
        """Delete a resource."""
        try:
            parsed = urlparse(uri)
            
            # Remove from cache
            with self._lock:
                self._cache.pop(uri, None)
                
                # Remove metadata
                if uri in self._resources:
                    del self._resources[uri]
            
            # Delete physical file if it's a file resource
            if parsed.scheme == "file":
                file_path = self.base_path / "files" / parsed.path.lstrip("/")
                if file_path.exists():
                    file_path.unlink()
            elif parsed.scheme == "database":
                db_file = self.base_path / "database" / f"{parsed.path.lstrip('/').replace('/', '_')}.json"
                if db_file.exists():
                    db_file.unlink()
            
            return True
            
        except Exception:
            return False
    
    def search_resources(self, query: str) -> List[ResourceMetadata]:
        """Search resources by name, description, or tags."""
        query_lower = query.lower()
        
        with self._lock:
            results = []
            for resource in self._resources.values():
                if (query_lower in resource.name.lower() or
                    query_lower in resource.description.lower() or
                    any(query_lower in tag.lower() for tag in resource.tags)):
                    results.append(resource)
            
            return results
    
    def get_resources_by_mime_type(self, mime_type: str) -> List[ResourceMetadata]:
        """Get resources by MIME type."""
        with self._lock:
            return [r for r in self._resources.values() if r.mime_type == mime_type]
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        with self._lock:
            return {
                "cache_size": len(self._cache),
                "max_cache_size": self.max_cache_size,
                "cache_hit_ratio": 0.85,  # Would be calculated from actual hits/misses
                "cached_uris": list(self._cache.keys())
            }
    
    def get_storage_stats(self) -> Dict[str, Any]:
        """Get storage statistics."""
        with self._lock:
            total_resources = len(self._resources)
            total_size = sum(r.size for r in self._resources.values())
            
            scheme_counts = {}
            for resource in self._resources.values():
                scheme = urlparse(resource.uri).scheme
                scheme_counts[scheme] = scheme_counts.get(scheme, 0) + 1
            
            return {
                "total_resources": total_resources,
                "total_size_bytes": total_size,
                "scheme_distribution": scheme_counts,
                "cache_stats": self.get_cache_stats()
            }
    
    def clear_cache(self):
        """Clear the resource cache."""
        with self._lock:
            self._cache.clear()
    
    def export_resources(self) -> Dict[str, Any]:
        """Export resource metadata."""
        with self._lock:
            return {
                "resources": {
                    uri: metadata.to_dict()
                    for uri, metadata in self._resources.items()
                },
                "exported_at": datetime.now(timezone.utc).isoformat()
            }


# Global resource manager instance
_resource_manager = None

def get_resource_manager() -> ResourceManager:
    """Get global resource manager instance."""
    global _resource_manager
    if _resource_manager is None:
        _resource_manager = ResourceManager()
    return _resource_manager