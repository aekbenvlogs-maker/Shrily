# Makefile — Qualité Python professionnelle

.PHONY: check fix test lint format type

check:
	ruff check .
	black --check .
	mypy mon_projet/src/
	pytest mon_projet/tests/ --cov=mon_projet/src --cov-report=term-missing --cov-fail-under=70

fix:
	ruff check . --fix
	black .

test:
	pytest mon_projet/tests/ --cov=mon_projet/src --cov-report=term-missing --cov-fail-under=70

lint:
	ruff check .

format:
	black .

type:
	mypy mon_projet/src/

migrate:
	alembic upgrade head

seed:
	python scripts/seed.py

dev-backend:
	uvicorn applicatif.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd ../frontend && npm run dev
