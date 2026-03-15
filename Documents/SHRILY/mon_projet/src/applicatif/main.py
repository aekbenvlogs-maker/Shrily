"""Entrypoint FastAPI pour l'API Diaspora Delivery.
Configure CORS, routes, et expose la racine.
"""

from __future__ import annotations

import sys

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from redis import asyncio as aioredis
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# --- APP INSTANCE ---
app = FastAPI()

limiter = Limiter(key_func=get_remote_address)

# --- LOGGING STRUCTURÉ ---
from loguru import logger

from .api.auth import router as auth_router
from .api.merchants import router as merchants_router
from .api.orders import router as orders_router
from .api.products import router as products_router
from .api.qr import router as qr_router
from .api.webhooks import router as webhooks_router

logger.remove()
# --- SENTRY (désactivé local) ---
# import sentry_sdk
# from sentry_sdk.integrations.fastapi import FastApiIntegration
# sentry_sdk.init(
#     dsn="__SENTRY_DSN__",  # Remplacer par la vraie DSN Sentry
#     integrations=[FastApiIntegration()],
#     traces_sample_rate=1.0,
#     environment="production",
# )

# --- PROMETHEUS ---
import asyncio

from fastapi.exception_handlers import RequestValidationError
from fastapi.exceptions import RequestValidationError as FastAPIRequestValidationError
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from starlette.exceptions import HTTPException as StarletteHTTPException


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"[UNHANDLED] {exc}", exc_info=True)
    import sentry_sdk

    sentry_sdk.capture_exception(exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(f"[HTTP] {exc.status_code} - {exc.detail}")
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(FastAPIRequestValidationError)
async def validation_exception_handler(
    request: Request, exc: FastAPIRequestValidationError
):
    logger.warning(f"[VALIDATION] {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )


# Initialisation du rate limiting (SlowAPI), Sentry, Prometheus

# Set up CORS, rate limiting, and routers at the top level (required by FastAPI)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(merchants_router, prefix="/merchants", tags=["merchants"])
app.include_router(products_router, prefix="/products", tags=["products"])
app.include_router(orders_router, prefix="/orders", tags=["orders"])
app.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])
app.include_router(qr_router, prefix="/qr", tags=["qr"])


# Prometheus Instrumentator doit être appelé au niveau global (FastAPI >=0.95)
Instrumentator().instrument(app).expose(app)

# Suppression dupliqué :
# (app.state.limiter, app.add_exception_handler, app.add_middleware, app.include_router)

# --- Suppression dupliqué :
# (app.state.limiter, app.add_exception_handler, app.add_middleware, app.include_router)


app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(merchants_router, prefix="/merchants", tags=["merchants"])
app.include_router(products_router, prefix="/products", tags=["products"])
app.include_router(orders_router, prefix="/orders", tags=["orders"])
app.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])
app.include_router(qr_router, prefix="/qr", tags=["qr"])


from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.extension import Limiter as LimiterExtension
from slowapi.util import get_remote_address


@app.get("/")
@limiter.limit("10/minute")
def root(request: Request) -> dict[str, str]:
    """Endpoint racine pour vérifier l'état du backend (limité à 10 req/min/IP)."""
    return {"message": "Backend SHRILY opérationnel"}
