"""Alembic migration: add notifications table for Diaspora Delivery (SHRILY).

Revision ID: 5757e5422d9d
Revises: 001_initial
Create Date: 2026-03-14 12:37:06.428028
"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "5757e5422d9d"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade():
    """Créer la table notifications."""
    op.create_table(
        "notifications",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("merchant_id", sa.Uuid(), nullable=False),
        sa.Column("message", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["merchant_id"], ["merchants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_id"), "notifications", ["id"], unique=False)


def downgrade():
    """Supprimer la table notifications."""
    op.drop_index(op.f("ix_notifications_id"), table_name="notifications")
    op.drop_table("notifications")
