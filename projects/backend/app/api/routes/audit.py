"""
API routes for audit log endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import logging

from app.models.schemas import AuditLogResponse, AuditEntry
from app.models.database import AuditLog, Vault, get_db
from app.services.blockchain_service import get_blockchain_service, BlockchainService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/{address}", response_model=AuditLogResponse)
async def get_audit_log(
    address: str,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    blockchain_service: BlockchainService = Depends(get_blockchain_service)
) -> AuditLogResponse:
    """
    Get audit log entries for a user address.
    
    Args:
        address: User's Algorand address
        limit: Maximum number of entries to return
        offset: Number of entries to skip
        db: Database session
        blockchain_service: Blockchain service dependency
    
    Returns:
        Audit log entries
    """
    try:
        # Get vault
        result = await db.execute(
            select(Vault).where(Vault.user_address == address)
        )
        vault = result.scalar_one_or_none()
        
        if not vault:
            raise HTTPException(status_code=404, detail="Vault not found")
        
        # Get audit entries from database
        result = await db.execute(
            select(AuditLog)
            .where(AuditLog.vault_id == vault.id)
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
            .offset(offset)
        )
        db_entries = result.scalars().all()
        
        # Convert to response format
        entries = [
            AuditEntry(
                id=entry.id,
                user_address=entry.user_address,
                risk_score=entry.risk_score,
                decision=entry.decision,
                timestamp=entry.timestamp,
            )
            for entry in db_entries
        ]
        
        # Get total count
        from sqlalchemy import func
        count_result = await db.execute(
            select(func.count(AuditLog.id)).where(AuditLog.vault_id == vault.id)
        )
        total = count_result.scalar()
        
        return AuditLogResponse(entries=entries, total=total)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get audit log: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get audit log: {str(e)}")


@router.get("/onchain/{index}")
async def get_onchain_audit_entry(
    index: int,
    blockchain_service: BlockchainService = Depends(get_blockchain_service)
) -> dict:
    """
    Get a specific audit log entry from the blockchain.
    
    Args:
        index: Audit log entry index
        blockchain_service: Blockchain service dependency
    
    Returns:
        Audit entry from blockchain
    """
    try:
        entry = await blockchain_service.get_audit_log(index)
        
        if not entry:
            raise HTTPException(status_code=404, detail="Audit entry not found")
        
        # Map decision codes to strings
        decision_map = {0: "BLOCKED", 1: "ALLOWED", 2: "FROZEN"}
        
        return {
            "index": index,
            "user_address": entry["user_address"],
            "risk_score": entry["risk_score"],
            "decision": decision_map.get(entry["decision"], "UNKNOWN"),
            "timestamp": entry["timestamp"],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get onchain audit entry: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get audit entry: {str(e)}")


@router.get("/onchain/count")
async def get_onchain_audit_count(
    blockchain_service: BlockchainService = Depends(get_blockchain_service)
) -> dict:
    """
    Get the total number of audit log entries on the blockchain.
    
    Args:
        blockchain_service: Blockchain service dependency
    
    Returns:
        Total audit count
    """
    try:
        count = await blockchain_service.get_audit_count()
        return {"total": count}
    except Exception as e:
        logger.error(f"Failed to get audit count: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get audit count: {str(e)}")
