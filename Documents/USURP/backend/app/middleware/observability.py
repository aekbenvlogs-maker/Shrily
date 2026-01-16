"""Middleware for observability integration"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import time
import logging
from app.core.observability import record_request, record_error, set_sentry_user

logger = logging.getLogger(__name__)


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """Middleware to record metrics and errors"""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Start timer
        start_time = time.time()
        
        # Extract user info for Sentry
        user_id = None
        try:
            if hasattr(request.state, "user"):
                user_id = request.state.user.get("id")
                set_sentry_user(user_id=user_id)
        except:
            pass
        
        try:
            # Process request
            response = await call_next(request)
            
            # Record metrics
            duration = time.time() - start_time
            record_request(
                method=request.method,
                endpoint=request.url.path,
                status=response.status_code,
                duration=duration
            )
            
            logger.info(
                f"{request.method} {request.url.path} - "
                f"{response.status_code} ({duration:.3f}s)"
            )
            
            return response
        
        except Exception as e:
            # Record error
            duration = time.time() - start_time
            record_error(type(e).__name__)
            
            logger.error(
                f"{request.method} {request.url.path} - "
                f"ERROR: {str(e)} ({duration:.3f}s)",
                exc_info=True
            )
            
            raise


class CacheMetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to record cache metrics"""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Store cache state in request
        request.state.cache_hits = 0
        request.state.cache_misses = 0
        
        response = await call_next(request)
        
        # Log cache stats
        if hasattr(request.state, "cache_hits") or hasattr(request.state, "cache_misses"):
            logger.debug(
                f"Cache - Hits: {getattr(request.state, 'cache_hits', 0)}, "
                f"Misses: {getattr(request.state, 'cache_misses', 0)}"
            )
        
        return response
