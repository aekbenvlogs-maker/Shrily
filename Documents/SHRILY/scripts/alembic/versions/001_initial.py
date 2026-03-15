"""Alembic migration: initial tables for Diaspora Delivery (SHRILY).

Creates all tables for User, Merchant, Product, Order, OrderItem, QRToken.
"""

import sqlalchemy as sa
from alembic import op

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


class UserRoleEnum(sa.Enum):
    """Enum des rôles utilisateur (diaspora, merchant, admin)."""

    diaspora = "diaspora"
    merchant = "merchant"
    admin = "admin"


class OrderStatusEnum(sa.Enum):
    """Enum des statuts de commande (pending, ready, completed, expired)."""

    pending = "pending"
    ready = "ready"
    completed = "completed"
    expired = "expired"


def upgrade() -> None:
    """Create all tables."""
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "email", sa.String(length=255), nullable=False, unique=True, index=True
        ),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=128), nullable=False),
        sa.Column("phone", sa.String(length=32)),
        sa.Column(
            "role",
            sa.Enum("diaspora", "merchant", "admin", name="userrole"),
            nullable=False,
            server_default="diaspora",
        ),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_table(
        "merchants",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("address", sa.String(length=255), nullable=False),
        sa.Column("wilaya", sa.String(length=64), nullable=False),
        sa.Column("logo_url", sa.String(length=255)),
        sa.Column("phone", sa.String(length=32)),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "merchant_id",
            sa.Integer(),
            sa.ForeignKey("merchants.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("description", sa.String(length=255)),
        sa.Column("price_eur_cents", sa.Integer(), nullable=False),
        sa.Column("image_url", sa.String(length=255)),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")
        ),
    )
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "merchant_id",
            sa.Integer(),
            sa.ForeignKey("merchants.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("beneficiary_name", sa.String(length=128), nullable=False),
        sa.Column("beneficiary_phone", sa.String(length=32), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "ready", "completed", "expired", name="orderstatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("total_eur_cents", sa.Integer(), nullable=False),
        sa.Column("service_fee_cents", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("completed_at", sa.DateTime()),
        sa.Column("expired_at", sa.DateTime()),
    )
    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "order_id",
            sa.Integer(),
            sa.ForeignKey("orders.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "product_id",
            sa.Integer(),
            sa.ForeignKey("products.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price_eur_cents", sa.Integer(), nullable=False),
    )
    op.create_table(
        "qr_tokens",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "order_id",
            sa.Integer(),
            sa.ForeignKey("orders.id"),
            nullable=False,
            unique=True,
            index=True,
        ),
        sa.Column(
            "token", sa.String(length=64), nullable=False, unique=True, index=True
        ),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column(
            "used", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
    )


def downgrade() -> None:
    """Drop all tables."""
    op.drop_table("qr_tokens")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("products")
    op.drop_table("merchants")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS orderstatus")
