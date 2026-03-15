"""Modèles de données principaux pour Diaspora Delivery (SHRILY).
Respecte mypy strict, ruff, SQLAlchemy 2.x.
"""

from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from infrastructure.db.base import Base

__all__ = [
    "Merchant",
    "Order",
    "OrderItem",
    "OrderStatus",
    "Product",
    "QRToken",
    "User",
    "UserRole",
]


class UserRole(str, enum.Enum):
    """Rôle d'un utilisateur (diaspora, commerçant, admin)."""

    DIASPORA = "diaspora"
    MERCHANT = "merchant"
    ADMIN = "admin"


class User(Base):
    """Utilisateur diaspora ou commerçant (accès web)."""

    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(128), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), nullable=False, default=UserRole.DIASPORA
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    orders: Mapped[list[Order]] = relationship("Order", back_populates="user")


class Merchant(Base):
    """Commerçant partenaire en Algérie."""

    __tablename__ = "merchants"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    wilaya: Mapped[str] = mapped_column(String(64), nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    products: Mapped[list[Product]] = relationship("Product", back_populates="merchant")
    orders: Mapped[list[Order]] = relationship("Order", back_populates="merchant")


class Product(Base):
    """Produit vendu par un commerçant (catalogue)."""

    __tablename__ = "products"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    merchant_id: Mapped[int] = mapped_column(
        ForeignKey("merchants.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    price_eur_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    merchant: Mapped[Merchant] = relationship("Merchant", back_populates="products")
    order_items: Mapped[list[OrderItem]] = relationship(
        "OrderItem", back_populates="product"
    )


class OrderStatus(str, enum.Enum):
    """Statut d'une commande (workflow)."""

    PENDING = "pending"
    READY = "ready"
    COMPLETED = "completed"
    EXPIRED = "expired"


class Order(Base):
    """Commande passée par la diaspora pour un bénéficiaire en Algérie."""

    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    merchant_id: Mapped[int] = mapped_column(
        ForeignKey("merchants.id"), nullable=False, index=True
    )
    beneficiary_name: Mapped[str] = mapped_column(String(128), nullable=False)
    beneficiary_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), nullable=False, default=OrderStatus.PENDING
    )
    total_eur_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    service_fee_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    expired_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    user: Mapped[User] = relationship("User", back_populates="orders")
    merchant: Mapped[Merchant] = relationship("Merchant", back_populates="orders")
    items: Mapped[list[OrderItem]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )
    qr_token: Mapped[QRToken | None] = relationship(
        "QRToken", back_populates="order", uselist=False
    )


class OrderItem(Base):
    """Ligne d'une commande (produit, quantité, prix unitaire)."""

    __tablename__ = "order_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id"), nullable=False, index=True
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"), nullable=False, index=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price_eur_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    order: Mapped[Order] = relationship("Order", back_populates="items")
    product: Mapped[Product] = relationship("Product", back_populates="order_items")


class QRToken(Base):
    """Jeton QR unique pour le retrait d'une commande (expire après 48h)."""

    __tablename__ = "qr_tokens"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id"), nullable=False, unique=True, index=True
    )
    token: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    order: Mapped[Order] = relationship("Order", back_populates="qr_token")
