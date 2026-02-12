"""
Pydantic schemas for API request/response models.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime


# ============================================================================
# Vault Schemas
# ============================================================================

class VaultCreate(BaseModel):
    """Schema for creating a new vault."""
    risk_threshold: int = Field(
        ...,
        ge=0,
        le=100,
        description="Personal risk threshold (0-100)"
    )
    user_address: str = Field(
        ...,
        description="User's Algorand address"
    )


class VaultResponse(BaseModel):
    """Schema for vault response."""
    user_address: str
    risk_threshold: int
    current_risk_score: int
    is_frozen: bool
    created_at: Optional[datetime] = None


class VaultUpdate(BaseModel):
    """Schema for updating vault settings."""
    risk_threshold: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="New risk threshold"
    )


# ============================================================================
# Risk Analysis Schemas
# ============================================================================

class TransactionData(BaseModel):
    """Schema for transaction data to analyze."""
    type: str = Field(
        ...,
        description="Transaction type (e.g., transfer, swap, stake)"
    )
    amount: float = Field(
        ...,
        ge=0,
        description="Amount in ALGO"
    )
    sender: str = Field(
        ...,
        description="Sender's Algorand address"
    )
    recipient: str = Field(
        ...,
        description="Recipient's Algorand address"
    )
    timestamp: Optional[str] = Field(
        None,
        description="Transaction timestamp"
    )
    protocol: Optional[str] = Field(
        None,
        description="Protocol name if applicable"
    )
    additional_context: Optional[dict] = Field(
        None,
        description="Additional context for analysis"
    )


class RiskAnalysisResponse(BaseModel):
    """Schema for risk analysis response."""
    risk_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Risk score (0-100)"
    )
    recommendation: Literal["ALLOW", "WARN", "BLOCK"] = Field(
        ...,
        description="AI recommendation"
    )
    reasoning: str = Field(
        ...,
        description="Explanation of the risk assessment"
    )
    model_used: str = Field(
        ...,
        description="AI model used for analysis"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence level (0-1)"
    )


class BatchAnalysisRequest(BaseModel):
    """Schema for batch transaction analysis."""
    transactions: list[TransactionData] = Field(
        ...,
        min_length=1,
        max_length=10,
        description="List of transactions to analyze"
    )


class BatchAnalysisResponse(BaseModel):
    """Schema for batch analysis response."""
    results: list[RiskAnalysisResponse]


# ============================================================================
# Freeze/Unfreeze Schemas
# ============================================================================

class FreezeRequest(BaseModel):
    """Schema for freezing a vault."""
    user_address: str = Field(
        ...,
        description="User's Algorand address to freeze"
    )
    reason: Optional[str] = Field(
        None,
        description="Reason for freezing"
    )


class UnfreezeRequest(BaseModel):
    """Schema for unfreezing a vault."""
    user_address: str = Field(
        ...,
        description="User's Algorand address to unfreeze"
    )


# ============================================================================
# Audit Log Schemas
# ============================================================================

class AuditEntry(BaseModel):
    """Schema for audit log entry."""
    id: int
    user_address: str
    risk_score: int
    decision: int = Field(
        ...,
        description="0=BLOCKED, 1=ALLOWED, 2=FROZEN"
    )
    timestamp: int


class AuditLogResponse(BaseModel):
    """Schema for audit log response."""
    entries: list[AuditEntry]
    total: int


# ============================================================================
# Health Check Schemas
# ============================================================================

class HealthResponse(BaseModel):
    """Schema for health check response."""
    status: str
    version: str
    blockchain_connected: bool
    ai_configured: bool
    database_connected: bool


class ModelInfoResponse(BaseModel):
    """Schema for AI model information."""
    model: str
    provider: str
    api_base: str
    configured: bool


# ============================================================================
# Error Schemas
# ============================================================================

class ErrorResponse(BaseModel):
    """Schema for error responses."""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


# ============================================================================
# Transaction Execution Schemas
# ============================================================================

class ExecuteTransactionRequest(BaseModel):
    """Schema for executing a transaction with risk check."""
    user_address: str
    action_type: str
    transaction_data: Optional[TransactionData] = None


class ExecuteTransactionResponse(BaseModel):
    """Schema for transaction execution response."""
    allowed: bool
    risk_score: Optional[int] = None
    recommendation: Optional[str] = None
    audit_entry_id: Optional[int] = None
