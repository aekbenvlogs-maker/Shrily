from __future__ import annotations

from decimal import Decimal


def calc_returns(prices: list[Decimal], period: int = 252) -> dict[str, Decimal | None]:
    """Calcule le rendement annualisé, la volatilité et le ratio de Sharpe.

    Args:
        prices: Liste de prix chronologiques (au moins 2 éléments).
        period: Nombre de périodes par an (252 pour actions, 365 pour crypto).

    Returns:
        Dictionnaire avec 'annual_return', 'volatility', 'sharpe'.

    Raises:
        ValueError: Si prices contient moins de 2 éléments.

    """
    if len(prices) < 2:
        raise ValueError(f"Au moins 2 prix nécessaires, reçu : {len(prices)}")
    returns: list[Decimal] = [
        (prices[i] - prices[i - 1]) / prices[i - 1] for i in range(1, len(prices))
    ]
    mean_return = sum(returns) / Decimal(len(returns))
    annual_return = mean_return * Decimal(period)
    variance = sum((r - mean_return) ** 2 for r in returns) / Decimal(len(returns))
    volatility = Decimal(str(variance ** Decimal("0.5"))) * Decimal(str(period**0.5))
    sharpe: Decimal | None = annual_return / volatility if volatility != 0 else None
    return {
        "annual_return": annual_return,
        "volatility": volatility,
        "sharpe": sharpe,
    }
