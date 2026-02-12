"""
API routes for vault management endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import logging

from app.models.schemas import (
    VaultCreate,
    VaultResponse,
    VaultUpdate,
    FreezeRequest,
    UnfreezeRequest,
)
from app.models.database import Vault, get_db
from app.services.blockchain_service import get_blockchain_service, BlockchainService
from app.services.ai_engine import get_ai_engine, AIRiskEngine
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vault", tags=["vault"])


@router.post("/create", response_model=VaultResponse)
async def create_vault(
    request: VaultCreate,
    db: AsyncSession = Depends(get_db),
    blockchain_service: BlockchainService = Depends(get_blockchain_service)
) -> VaultResponse:
    """
    Create a new Guardian Vault for a user.
    
    Args:
        request: Vault creation request
        db: Database session
        blockchain_service: Blockchain service dependency
    
    Returns:
        Created vault information
    """
    try:
        # Check if vault already exists
        result = await db.execute(
            select(Vault).where(Vault.user_address == request.user_address)
        )
        existing_vault = result.scalar_one_or_none()
        
        if existing_vault:
            raise HTTPException(status_code=400, detail="Vault already exists for this address")
        
        # Create vault in database
        vault = Vault(
            user_address=request.user_address,
            risk_threshold=request.risk_threshold,
            current_risk_score=0,
            is_frozen=False,
        )
        db.add(vault)
        await db.commit()
        await db.refresh(vault)
        
        # Note: In production, you would also call the smart contract here
        # to create the vault on-chain. This requires the user to sign a transaction.
        logger.info(f"Vault created for {request.user_address} with threshold {request.risk_threshold}")
        
        return VaultResponse(
            user_address=vault.user_address,
            risk_threshold=vault.risk_threshold,
            current_risk_score=vault.current_risk_score,
            is_frozen=vault.is_frozen,
            created_at=vault.created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create vault: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create vault: {str(e)}")


@router.get("/{address}", response_model=VaultResponse)
async def get_vault(
    address: str,
    db: AsyncSession = Depends(get_db),
    blockchain_service: BlockchainService = Depends(get_blockchain_service)
) -> VaultResponse:
    """
    Get vault information for a user address.
    
    Args:
        address: User's Algorand address
        db: Database session
        blockchain_service: Blockchain service dependency
    
    Returns:
        Vault information
    """
    try:
        # Get from database
        result = await db.execute(
            select(Vault).where(Vault.user_address == address)
        )
        vault = result.scalar_one_or_none()
        
        if not vault:
            raise HTTPException(status_code=404, detail="Vault not found")
        
        # Optionally sync with blockchain
        on_chain_status = await blockchain_service.get_vault_status(address)
        if on_chain_status:
            vault.current_risk_score = on_chain_status.get("risk_score", vault.current_risk_score)
            vault.is_frozen = on_chain_status.get("is_frozen", vault.is_frozen)
            await db.commit()
        
        return VaultResponse(
            user_address=vault.user_address,
            risk_threshold=vault.risk_threshold,
            current_risk_score=vault.current_risk_score,
            is_frozen=vault.is_frozen,
            created_at=vault.created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get vault: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get vault: {str(e)}")


@router.put("/{address}", response_model=VaultResponse)
async def update_vault(
    address: str,
    request: VaultUpdate,
    db: AsyncSession = Depends(get_db)
) -> VaultResponse:
    """
    Update vault settings.
    
    Args:
        address: User's Algorand address
        request: Vault update request
        db: Database session
    
    Returns:
        Updated vault information
    """
    try:
        result = await db.execute(
            select(Vault).where(Vault.user_address == address)
        )
        vault = result.scalar_one_or_none()
        
        if not vault:
            raise HTTPException(status_code=404, detail="Vault not found")
        
        # Update threshold if provided
        if request.risk_threshold is not None:
            vault.risk_threshold = request.risk_threshold
        
        await db.commit()
        await db.refresh(vault)
        
        logger.info(f"Vault updated for {address}")
        
        return VaultResponse(
            user_address=vault.user_address,
            risk_threshold=vault.risk_threshold,
            current_risk_score=vault.current_risk_score,
            is_frozen=vault.is_frozen,
            created_at=vault.created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update vault: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update vault: {str(e)}")


@router.post("/freeze")
async def freeze_vault(
    request: FreezeRequest,
    db: AsyncSession = Depends(get_db),
    blockchain_service: BlockchainService = Depends(get_blockchain_service)
) -> dict:
    """
    Freeze a vault (emergency action).
    
    Args:
        request: Freeze request
        db: Database session
        blockchain_service: Blockchain service dependency
    
    Returns:
        Success message
    """
    try:
        result = await db.execute(
            select(Vault).where(Vault.user_address == request.user_address)
        )
        vault = result.scalar_one_or_none()
        
        if not vault:
            raise HTTPException(status_code=404, detail="Vault not found")
        
        # Update database
        vault.is_frozen = True
        await db.commit()
        
        # Freeze on blockchain
        # Note: This requires the owner or AI authorizer to sign
        # For now, we'll just log it
        logger.warning(f"Vault freeze requested for {request.user_address}. Reason: {request.reason}")
        
        return {
            "success": True,
            "message": f"Vault for {request.user_address} has been frozen",
            "reason": request.reason,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to freeze vault: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to freeze vault: {str(e)}")


@router.post("/unfreeze")
async def unfreeze_vault(
    request: UnfreezeRequest,
    db: AsyncSession = Depends(get_db),
    blockchain_service: BlockchainService = Depends(get_blockchain_service)
) -> dict:
    """
    Unfreeze a vault.
    
    Args:
        request: Unfreeze request
        db: Database session
        blockchain_service: Blockchain service dependency
    
    Returns:
        Success message
    """
    try:
        result = await db.execute(
            select(Vault).where(Vault.user_address == request.user_address)
        )
        vault = result.scalar_one_or_none()
        
        if not vault:
            raise HTTPException(status_code=404, detail="Vault not found")
        
        # Update database
        vault.is_frozen = False
        await db.commit()
        
        # Unfreeze on blockchain
        # Note: This requires the owner to sign
        logger.info(f"Vault unfreeze requested for {request.user_address}")
        
        return {
            "success": True,
            "message": f"Vault for {request.user_address} has been unfrozen",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to unfreeze vault: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to unfreeze vault: {str(e)}")


@router.post("/check-transaction")
async def check_transaction(
    user_address: str,
    action_type: str,
    db: AsyncSession = Depends(get_db),
    blockchain_service: BlockchainService = Depends(get_blockchain_service)
) -> dict:
    """
    Check if a transaction is allowed based on risk score.
    
    Args:
        user_address: User's Algorand address
        action_type: Type of action being attempted
        db: Database session
        blockchain_service: Blockchain service dependency
    
    Returns:
        Transaction check result
    """
    try:
        # Get vault
        result = await db.execute(
            select(Vault).where(Vault.user_address == user_address)
        )
        vault = result.scalar_one_or_none()
        
        if not vault:
            raise HTTPException(status_code=404, detail="Vault not found")
        
        # Check if frozen
        if vault.is_frozen:
            return {
                "allowed": False,
                "reason": "Vault is frozen",
                "risk_score": vault.current_risk_score,
            }
        
        # Check on blockchain
        allowed = await blockchain_service.check_and_execute(user_address, action_type)
        
        return {
            "allowed": allowed,
            "risk_score": vault.current_risk_score,
            "threshold": vault.risk_threshold,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to check transaction: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check transaction: {str(e)}")
