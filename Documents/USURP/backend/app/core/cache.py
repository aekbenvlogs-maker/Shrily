"""Redis caching utilities for USURP"""
import json
import redis
from functools import wraps
from typing import Any, Callable, Optional
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

class CacheManager:
    """Redis cache management"""
    
    def __init__(self, host: str = "redis", port: int = 6379, db: int = 0):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.Redis(
                host=host,
                port=port,
                db=db,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
                health_check_interval=30
            )
            # Test connection
            self.redis_client.ping()
            logger.info("✅ Redis cache connected")
        except Exception as e:
            logger.warning(f"⚠️ Redis cache unavailable: {e}")
            self.redis_client = None
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.redis_client:
            return None
        
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.warning(f"Cache GET error: {e}")
        
        return None
    
    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in cache"""
        if not self.redis_client:
            return False
        
        try:
            self.redis_client.setex(
                key,
                ttl,
                json.dumps(value, default=str)
            )
            return True
        except Exception as e:
            logger.warning(f"Cache SET error: {e}")
        
        return False
    
    def delete(self, key: str) -> bool:
        """Delete value from cache"""
        if not self.redis_client:
            return False
        
        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Cache DELETE error: {e}")
        
        return False
    
    def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern"""
        if not self.redis_client:
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
        except Exception as e:
            logger.warning(f"Cache CLEAR error: {e}")
        
        return 0
    
    def is_available(self) -> bool:
        """Check if cache is available"""
        return self.redis_client is not None


# Global cache instance
cache_manager: Optional[CacheManager] = None


def init_cache(host: str = "redis", port: int = 6379) -> CacheManager:
    """Initialize global cache manager"""
    global cache_manager
    cache_manager = CacheManager(host, port)
    return cache_manager


def get_cache() -> Optional[CacheManager]:
    """Get global cache manager"""
    return cache_manager


def cached(ttl: int = 300, key_prefix: str = ""):
    """Decorator to cache function results"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs) -> Any:
            cache = get_cache()
            if not cache or not cache.is_available():
                return await func(*args, **kwargs)
            
            # Build cache key
            cache_key = f"{key_prefix or func.__name__}:{str(args)}:{str(kwargs)}"
            cache_key = cache_key.replace(" ", "")
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache HIT: {cache_key}")
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            logger.debug(f"Cache SET: {cache_key}")
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs) -> Any:
            cache = get_cache()
            if not cache or not cache.is_available():
                return func(*args, **kwargs)
            
            # Build cache key
            cache_key = f"{key_prefix or func.__name__}:{str(args)}:{str(kwargs)}"
            cache_key = cache_key.replace(" ", "")
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache HIT: {cache_key}")
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            logger.debug(f"Cache SET: {cache_key}")
            
            return result
        
        # Return async or sync wrapper based on function
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


def invalidate_cache(pattern: str = "*") -> int:
    """Invalidate cache entries matching pattern"""
    cache = get_cache()
    if not cache or not cache.is_available():
        return 0
    
    return cache.clear_pattern(pattern)
