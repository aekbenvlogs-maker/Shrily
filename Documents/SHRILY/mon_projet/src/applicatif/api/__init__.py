from __future__ import annotations

from .auth import router as auth_router
from .merchants import router as merchants_router
from .orders import router as orders_router
from .products import router as products_router
from .qr import router as qr_router
from .webhooks import router as webhooks_router

__all__ = [
    "auth_router",
    "merchants_router",
    "products_router",
    "orders_router",
    "webhooks_router",
    "qr_router",
]
