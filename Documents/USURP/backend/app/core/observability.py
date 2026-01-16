"""Observability utilities for USURP (Prometheus + Sentry)"""
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry
from prometheus_client.openmetrics.exposition import generate_latest
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
import logging
import time
from typing import Callable, Any
from functools import wraps

logger = logging.getLogger(__name__)

# ========== PROMETHEUS METRICS ==========

class PrometheusMetrics:
    """Prometheus metrics collection"""
    
    def __init__(self):
        self.registry = CollectorRegistry()
        
        # Request metrics
        self.requests_total = Counter(
            'usurp_requests_total',
            'Total HTTP requests',
            ['method', 'endpoint', 'status'],
            registry=self.registry
        )
        
        self.request_duration = Histogram(
            'usurp_request_duration_seconds',
            'HTTP request duration',
            ['method', 'endpoint'],
            buckets=(0.1, 0.5, 1.0, 2.0, 5.0),
            registry=self.registry
        )
        
        # Identity operations
        self.identity_registrations = Counter(
            'usurp_identity_registrations_total',
            'Total identity registrations',
            ['status'],
            registry=self.registry
        )
        
        self.identity_checks = Counter(
            'usurp_identity_checks_total',
            'Total identity checks',
            ['found'],
            registry=self.registry
        )
        
        # Database metrics
        self.db_operations = Counter(
            'usurp_db_operations_total',
            'Total database operations',
            ['operation', 'table'],
            registry=self.registry
        )
        
        self.db_duration = Histogram(
            'usurp_db_duration_seconds',
            'Database operation duration',
            ['operation'],
            buckets=(0.01, 0.05, 0.1, 0.5, 1.0),
            registry=self.registry
        )
        
        # Cache metrics
        self.cache_hits = Counter(
            'usurp_cache_hits_total',
            'Total cache hits',
            ['key_prefix'],
            registry=self.registry
        )
        
        self.cache_misses = Counter(
            'usurp_cache_misses_total',
            'Total cache misses',
            ['key_prefix'],
            registry=self.registry
        )
        
        # Active users gauge
        self.active_users = Gauge(
            'usurp_active_users',
            'Current active users',
            registry=self.registry
        )
        
        # Error metrics
        self.errors_total = Counter(
            'usurp_errors_total',
            'Total errors',
            ['error_type'],
            registry=self.registry
        )
        
        # Audit log metrics
        self.audit_logs = Counter(
            'usurp_audit_logs_total',
            'Total audit logs',
            ['action', 'status'],
            registry=self.registry
        )
    
    def get_metrics(self) -> bytes:
        """Get metrics in OpenMetrics format"""
        return generate_latest(self.registry)


# Global metrics instance
metrics: PrometheusMetrics = PrometheusMetrics()


def init_observability(sentry_dsn: str = None, environment: str = "production"):
    """Initialize Sentry and Prometheus"""
    global metrics
    
    # Initialize Sentry
    if sentry_dsn:
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[
                FastApiIntegration(),
                SqlalchemyIntegration()
            ],
            environment=environment,
            traces_sample_rate=0.1,  # 10% of transactions
            profiles_sample_rate=0.1
        )
        logger.info(f"✅ Sentry initialized for {environment}")
    
    logger.info("✅ Prometheus metrics initialized")


def record_request(method: str, endpoint: str, status: int, duration: float):
    """Record HTTP request metrics"""
    metrics.requests_total.labels(
        method=method,
        endpoint=endpoint,
        status=status
    ).inc()
    
    metrics.request_duration.labels(
        method=method,
        endpoint=endpoint
    ).observe(duration)


def record_identity_registration(success: bool):
    """Record identity registration"""
    status = "success" if success else "failure"
    metrics.identity_registrations.labels(status=status).inc()


def record_identity_check(found: bool):
    """Record identity check"""
    found_str = "found" if found else "not_found"
    metrics.identity_checks.labels(found=found_str).inc()


def record_db_operation(operation: str, table: str, duration: float):
    """Record database operation"""
    metrics.db_operations.labels(
        operation=operation,
        table=table
    ).inc()
    
    metrics.db_duration.labels(
        operation=operation
    ).observe(duration)


def record_cache_hit(key_prefix: str):
    """Record cache hit"""
    metrics.cache_hits.labels(key_prefix=key_prefix).inc()


def record_cache_miss(key_prefix: str):
    """Record cache miss"""
    metrics.cache_misses.labels(key_prefix=key_prefix).inc()


def record_error(error_type: str):
    """Record error"""
    metrics.errors_total.labels(error_type=error_type).inc()
    
    # Also report to Sentry
    try:
        sentry_sdk.capture_message(f"Error: {error_type}", level="error")
    except:
        pass


def record_audit_log(action: str, success: bool):
    """Record audit log event"""
    status = "success" if success else "failure"
    metrics.audit_logs.labels(action=action, status=status).inc()


def set_active_users(count: int):
    """Set active users gauge"""
    metrics.active_users.set(count)


def measure_db_operation(operation: str, table: str):
    """Decorator to measure database operations"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs) -> Any:
            start = time.time()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start
                record_db_operation(operation, table, duration)
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs) -> Any:
            start = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start
                record_db_operation(operation, table, duration)
        
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


# ========== SENTRY ERROR TRACKING ==========

def capture_exception(exc: Exception, level: str = "error", context: dict = None):
    """Capture exception with Sentry"""
    try:
        with sentry_sdk.push_scope() as scope:
            if context:
                for key, value in context.items():
                    scope.set_context(key, value)
            
            sentry_sdk.capture_exception(exc, level=level)
    except Exception as e:
        logger.warning(f"Failed to report error to Sentry: {e}")


def set_sentry_user(user_id: str = None, email: str = None, username: str = None):
    """Set current user in Sentry context"""
    try:
        sentry_sdk.set_user({
            "id": user_id,
            "email": email,
            "username": username
        })
    except Exception as e:
        logger.warning(f"Failed to set Sentry user: {e}")


def get_metrics_export() -> bytes:
    """Get metrics in OpenMetrics format for /metrics endpoint"""
    return metrics.get_metrics()
