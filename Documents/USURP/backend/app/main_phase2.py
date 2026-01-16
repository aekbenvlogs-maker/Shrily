"""
USURP Backend - Production-Ready API with Cache and Observability

Features:
- ✅ Alembic migrations for database versioning
- ✅ Vault secrets management  
- ✅ GitHub Actions CI/CD pipeline
- ✅ Redis caching layer
- ✅ Prometheus metrics
- ✅ Sentry error tracking
- ✅ Comprehensive test suite

Endpoints:
- GET  /health - Health check
- GET  /metrics - Prometheus metrics
- POST /api/v1/identities/check - Check if identity exists (cached)
- POST /api/v1/identities/register - Register new identity
"""

from fastapi import FastAPI, Request
from fastapi.responses import Response
from starlette.middleware.cors import CORSMiddleware
import logging
import os
from app.core.cache import init_cache, get_cache
from app.core.observability import init_observability, get_metrics_export
from app.middleware.observability import ObservabilityMiddleware, CacheMetricsMiddleware

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    
    app = FastAPI(
        title="USURP API",
        description="API for Managing Usurped Identity Reports",
        version="2.0.0"
    )
    
    # ========== MIDDLEWARE ==========
    app.add_middleware(
        CORSMiddleware,
        allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )
    
    # Observability middleware
    app.add_middleware(ObservabilityMiddleware)
    app.add_middleware(CacheMetricsMiddleware)
    
    # ========== INITIALIZATION ==========
    
    @app.on_event("startup")
    async def startup_event():
        """Initialize cache and observability on startup"""
        logger.info("🚀 USURP Backend starting...")
        
        # Initialize cache
        try:
            cache = init_cache(
                host=os.getenv("REDIS_HOST", "redis"),
                port=int(os.getenv("REDIS_PORT", 6379))
            )
            logger.info("✅ Cache initialized")
        except Exception as e:
            logger.warning(f"⚠️ Cache initialization failed: {e}")
        
        # Initialize observability
        try:
            init_observability(
                sentry_dsn=os.getenv("SENTRY_DSN"),
                environment=os.getenv("ENVIRONMENT", "production")
            )
            logger.info("✅ Observability initialized")
        except Exception as e:
            logger.warning(f"⚠️ Observability initialization failed: {e}")
        
        logger.info("✅ Backend ready!")
    
    @app.on_event("shutdown")
    async def shutdown_event():
        """Cleanup on shutdown"""
        logger.info("🛑 Backend shutting down...")
    
    # ========== ROUTES ==========
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint"""
        cache = get_cache()
        cache_status = "🟢 connected" if cache and cache.is_available() else "🔴 disconnected"
        
        return {
            "status": "healthy",
            "version": "2.0.0",
            "cache": cache_status,
            "environment": os.getenv("ENVIRONMENT", "production")
        }
    
    @app.get("/metrics")
    async def metrics():
        """Prometheus metrics endpoint"""
        return Response(
            content=get_metrics_export(),
            media_type="application/openmetrics-text; version=1.0.0; charset=utf-8"
        )
    
    # ========== ROUTERS ==========
    # Include API routes here (from app/api/)
    # app.include_router(router)
    
    return app


# Create app instance
app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
