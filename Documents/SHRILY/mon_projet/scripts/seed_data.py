from datetime import datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from applicatif.core.models import Base, Merchant, Product, User
from applicatif.infrastructure.database import SessionLocal, engine

# --- Seed data ---
MERCHANTS = [
    Merchant(
        id=str(uuid4()),
        name="Épicerie du Centre",
        category="Épicerie",
        wilaya="Alger",
        address="12 rue Didouche Mourad, Alger",
        logo_url=None,
        is_active=True,
        created_at=datetime.utcnow(),
    ),
    Merchant(
        id=str(uuid4()),
        name="Pharmacie El Madania",
        category="Pharmacie",
        wilaya="Alger",
        address="5 avenue Pasteur, Alger",
        logo_url=None,
        is_active=True,
        created_at=datetime.utcnow(),
    ),
    Merchant(
        id=str(uuid4()),
        name="Boulangerie Benali",
        category="Boulangerie",
        wilaya="Alger",
        address="3 rue Hassiba Ben Bouali, Alger",
        logo_url=None,
        is_active=True,
        created_at=datetime.utcnow(),
    ),
]

PRODUCTS = []
for merchant in MERCHANTS:
    for i in range(1, 6):
        PRODUCTS.append(
            Product(
                id=str(uuid4()),
                merchant_id=merchant.id,
                name=f"Produit {i} {merchant.name}",
                price_eur=100 * i,
                photo_url=None,
                is_available=True,
            )
        )

USER = User(
    id=str(uuid4()),
    email="test@diaspora.fr",
    hashed_password="$2b$12$Q9Qw1Qw1Qw1Qw1Qw1Qw1QeQw1Qw1Qw1Qw1Qw1Qw1Qw1Qw1Qw1Qw1Q",  # hash fictif
    full_name="Test Diaspora",
    created_at=datetime.utcnow(),
)


def seed():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    db.query(Product).delete()
    db.query(Merchant).delete()
    db.query(User).delete()
    db.commit()
    db.add_all(MERCHANTS)
    db.add_all(PRODUCTS)
    db.add(USER)
    db.commit()
    db.close()


if __name__ == "__main__":
    seed()
