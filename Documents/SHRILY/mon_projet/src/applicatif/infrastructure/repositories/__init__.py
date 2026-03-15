"""Package repositories CRUD pour SHRILY (user, merchant, order, product)."""

from __future__ import annotations

from .merchant_repo import MerchantRepository
from .order_repo import OrderRepository
from .product_repo import ProductRepository
from .user_repo import UserRepository

__all__ = [
    "UserRepository",
    "MerchantRepository",
    "OrderRepository",
    "ProductRepository",
]
