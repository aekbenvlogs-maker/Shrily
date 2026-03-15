"""
Endpoints d'authentification (inscription, login) pour SHRILY.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from ..infrastructure.db.session import get_db
from ..infrastructure.repositories.user_repo import UserRepository

router = APIRouter(tags=["auth"])

SECRET_KEY = os.environ.get("JWT_SECRET", "dev-secret-change-in-prod")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RegisterRequest(BaseModel):
    """Requête d'inscription utilisateur."""

    email: EmailStr
    password: str
    full_name: str


class LoginRequest(BaseModel):
    """Requête de login utilisateur."""

    email: EmailStr
    password: str


class Token(BaseModel):
    """Token JWT retourné à l'utilisateur."""

    access_token: str
    token_type: str


def create_token(user_id: str) -> str:
    """Crée un JWT signé pour l'utilisateur."""
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", response_model=Token)
def register(data: RegisterRequest, db: Session = Depends(get_db)) -> Token:
    """Inscrit un nouvel utilisateur et retourne un token."""
    if UserRepository.get_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = pwd_context.hash(data.password)
    user = UserRepository.create(db, data.email, data.full_name, hashed)
    return Token(access_token=create_token(str(user.id)), token_type="bearer")


@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)) -> Token:
    """Connecte un utilisateur et retourne un token."""
    user = UserRepository.get_by_email(db, data.email)
    if not user or not pwd_context.verify(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return Token(access_token=create_token(str(user.id)), token_type="bearer")
