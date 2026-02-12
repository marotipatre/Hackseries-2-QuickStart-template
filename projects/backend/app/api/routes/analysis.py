"""
API routes for risk analysis endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List
import logging

from app.models.schemas import (
    TransactionData,
    RiskAnalysisResponse,
    BatchAnalysisRequest,
    BatchAnalysisResponse,
    ModelInfoResponse,
)
from app.services.ai_engine import get_ai_engine, AIRiskEngine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/risk", response_model=RiskAnalysisResponse)
async def analyze_risk(
    transaction_data: TransactionData,
    ai_engine: AIRiskEngine = Depends(get_ai_engine)
) -> RiskAnalysisResponse:
    """
    Analyze a transaction for risk using AI.
    
    Args:
        transaction_data: Transaction details to analyze
        ai_engine: AI engine dependency
    
    Returns:
        Risk analysis result with score and recommendation
    """
    try:
        logger.info(f"Analyzing transaction: {transaction_data.type} - {transaction_data.amount} ALGO")
        
        # Convert to dict for AI engine
        tx_dict = transaction_data.model_dump()
        
        # Get AI analysis
        result = await ai_engine.analyze_transaction(tx_dict)
        
        return RiskAnalysisResponse(**result)
    except Exception as e:
        logger.error(f"Risk analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Risk analysis failed: {str(e)}")


@router.post("/batch", response_model=BatchAnalysisResponse)
async def batch_analyze(
    request: BatchAnalysisRequest,
    ai_engine: AIRiskEngine = Depends(get_ai_engine)
) -> BatchAnalysisResponse:
    """
    Analyze multiple transactions in batch.
    
    Args:
        request: Batch analysis request with transactions
        ai_engine: AI engine dependency
    
    Returns:
        Batch analysis results
    """
    try:
        logger.info(f"Batch analyzing {len(request.transactions)} transactions")
        
        # Convert to list of dicts
        transactions = [tx.model_dump() for tx in request.transactions]
        
        # Get batch analysis
        results = await ai_engine.batch_analyze(transactions)
        
        return BatchAnalysisResponse(results=results)
    except Exception as e:
        logger.error(f"Batch analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")


@router.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info(
    ai_engine: AIRiskEngine = Depends(get_ai_engine)
) -> ModelInfoResponse:
    """
    Get information about the AI model being used.
    
    Args:
        ai_engine: AI engine dependency
    
    Returns:
        Model information
    """
    try:
        info = await ai_engine.get_model_info()
        return ModelInfoResponse(**info)
    except Exception as e:
        logger.error(f"Failed to get model info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")
