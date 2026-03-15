"""
Modèles de données principaux pour Diaspora Delivery (SHRILY).
Respecte mypy strict, ruff, SQLAlchemy 2.x.

Inclut User, Merchant, Product, Order, OrderItem, Notification, QRToken.
"""

from __future__ import annotations

import enum
from datetime import datetime, timedelta
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, declarative_base, mapped_column, relationship

Base = declarative_base()


class Notification(Base):
    """Représente une notification envoyée à un commerçant."""

    __tablename__ = "notifications"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4, index=True)
    merchant_id: Mapped[UUID] = mapped_column(ForeignKey("merchants.id"), index=True)
    message: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class OrderStatus(str, enum.Enum):
    """Statut d'une commande."""

    PENDING = "PENDING"
    READY = "READY"


class User(Base):
    """Utilisateur Diaspora ou commerçant."""

    __tablename__ = "users"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    role: Mapped[str] = mapped_column(String, default="diaspora")


class Merchant(Base):
    """Commerçant partenaire."""

    __tablename__ = "merchants"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Product(Base):
    """Produit vendu par un commerçant."""

    __tablename__ = "products"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    merchant_id: Mapped[UUID] = mapped_column(ForeignKey("merchants.id"))


class Order(Base):
    __tablename__ = "orders"
    id: Mapped[UUID] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    user_id: Mapped[UUID] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    merchant_id: Mapped[UUID] = mapped_column(
        String(36), ForeignKey("merchants.id"), nullable=False, index=True
    )
    beneficiary_name: Mapped[str] = mapped_column(String(128), nullable=False)
    beneficiary_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(
        SQLAlchemyEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False
    )
    total_eur: Mapped[int] = mapped_column(Integer, nullable=False)
    stripe_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    stripe_event_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, unique=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.utcnow() + timedelta(hours=48),
        nullable=False,
    )
    user: Mapped[User] = relationship("User", back_populates="orders")
    merchant: Mapped[Merchant] = relationship("Merchant", back_populates="orders")
    items: Mapped[list[OrderItem]] = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"
    id: Mapped[UUID] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    order_id: Mapped[UUID] = mapped_column(
        String(36), ForeignKey("orders.id"), nullable=False, index=True
    )
    product_id: Mapped[UUID] = mapped_column(
        String(36), ForeignKey("products.id"), nullable=False, index=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price_eur: Mapped[int] = mapped_column(Integer, nullable=False)
    order: Mapped[Order] = relationship("Order", back_populates="items")
    product: Mapped[Product] = relationship("Product", back_populates="order_items")


class QRToken(Base):
    __tablename__ = "qr_tokens"
    id: Mapped[UUID] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    order_id: Mapped[UUID] = mapped_column(
        String(36), ForeignKey("orders.id"), unique=True, nullable=False, index=True
    )
    token: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        default=lambda: str(uuid4()),
        index=True,
    )
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.utcnow() + timedelta(hours=48),
        nullable=False,
    )
    order: Mapped[Order] = relationship("Order")
