"""Example integration of cache and observability in identity check endpoint"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app.core.cache import cached, get_cache, cache_manager
from app.core.observability import (
    record_identity_check,
    record_cache_hit,
    record_cache_miss,
    capture_exception
)
from app.models import UsurpedIdentity
import hashlib

router = APIRouter(prefix="/api/v1/identities", tags=["identities"])


@router.post("/check")
async def check_identity(
    data: dict,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Check if identity exists (with caching)
    
    Example:
    ```json
    {
        "identity_number": "ABC123456"
    }
    ```
    """
    try:
        identity_number = data.get("identity_number")
        if not identity_number:
            raise HTTPException(status_code=400, detail="identity_number required")
        
        # Generate hashed identity for lookup
        identity_hash = hashlib.sha256(identity_number.encode()).hexdigest()
        
        # Try cache first
        cache_key = f"identity_check:{identity_hash}"
        cache = get_cache()
        
        if cache and cache.is_available():
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                record_cache_hit("identity_check")
                record_identity_check(cached_result.get("found"))
                return cached_result
            else:
                record_cache_miss("identity_check")
        
        # Query database
        identity = db.query(UsurpedIdentity).filter(
            UsurpedIdentity.official_id_hash == identity_hash
        ).first()
        
        found = identity is not None
        result = {
            "found": found,
            "identity_id": identity.id if identity else None,
            "status": identity.status if identity else None
        }
        
        # Cache result (5 minutes)
        if cache and cache.is_available():
            cache.set(cache_key, result, ttl=300)
        
        # Record metrics
        record_identity_check(found)
        
        return result
    
    except Exception as e:
        capture_exception(e, context={
            "endpoint": "/check",
            "ip": request.client.host
        })
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/cache/clear")
async def clear_cache(pattern: str = "*"):
    """
    Clear cache entries (admin only)
    
    Example:
    ```
    POST /api/v1/identities/cache/clear?pattern=identity_check:*
    ```
    """
    cache = get_cache()
    if not cache or not cache.is_available():
        raise HTTPException(status_code=503, detail="Cache not available")
    
    cleared = cache.clear_pattern(pattern)
    return {"cleared": cleared, "pattern": pattern}
