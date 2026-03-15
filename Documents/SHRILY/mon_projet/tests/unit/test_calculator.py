"""Tests unitaires pour calc_returns (core.calculator)."""

from decimal import Decimal

import pytest

from src.applicatif.core.calculator import calc_returns


@pytest.fixture
def btc_prices():
    """Fixture : prix BTC simulés."""
    return [Decimal("45000.00"), Decimal("46000.00"), Decimal("47000.00")]


@pytest.fixture
def flat_prices():
    """Fixture : prix constants."""
    return [Decimal("100.00"), Decimal("100.00"), Decimal("100.00")]


@pytest.fixture
def single_price():
    """Fixture : un seul prix."""
    return [Decimal("100.00")]


@pytest.fixture
def empty_prices():
    """Fixture : liste vide de prix."""
    return []


def test_calc_returns_nominal(btc_prices):
    """Test : calcul nominal sur prix BTC."""
    result = calc_returns(btc_prices)
    assert "annual_return" in result
    assert "volatility" in result
    assert "sharpe" in result
    assert result["annual_return"] is not None
    assert result["volatility"] is not None


def test_calc_returns_flat(flat_prices):
    """Test : volatilité nulle sur prix constants."""
    result = calc_returns(flat_prices)
    assert result["volatility"] == Decimal("0")
    assert result["sharpe"] is None


def test_calc_returns_single_price(single_price):
    """Test : erreur si un seul prix."""
    with pytest.raises(ValueError, match="Au moins 2 prix nécessaires"):
        calc_returns(single_price)


def test_calc_returns_empty(empty_prices):
    """Test : erreur si liste vide."""
    with pytest.raises(ValueError, match="Au moins 2 prix nécessaires"):
        calc_returns(empty_prices)


def test_calc_returns_wrong_type():
    """Test : erreur si mauvais type d'entrée."""
    with pytest.raises(TypeError):
        calc_returns(["100", "200"])  # Strings au lieu de Decimal
