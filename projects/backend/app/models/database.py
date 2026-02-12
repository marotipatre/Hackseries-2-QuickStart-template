"""
Database models for ChainGuardian backend.
"""

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, 
    Float, Text, ForeignKey, create_engine
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import asyncio
from sqlalchemy.ext.asyncio import (
    AsyncSession, create_async_engine, async_sessionmaker
)

from app.config import settings

Base = declarative_base()


class Vault(Base):
    """Database model for user vaults."""
    __tablename__ = "vaults"
    
    id = Column(Integer, primary_key=True, index=True)
    user_address = Column(String(58), unique=True, index=True, nullable=False)
    risk_threshold = Column(Integer, default=70, nullable=False)
    current_risk_score = Column(Integer, default=0, nullable=False)
    is_frozen = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    audit_logs = relationship("AuditLog", back_populates="vault", cascade="all, delete-orphan")
    risk_analyses = relationship("RiskAnalysis", back_populates="vault", cascade="all, delete-orphan")


class RiskAnalysis(Base):
    """Database model for AI risk analyses."""
    __tablename__ = "risk_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    vault_id = Column(Integer, ForeignKey("vaults.id"), nullable=False)
    transaction_type = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    sender = Column(String(58), nullable=False)
    recipient = Column(String(58), nullable=False)
    risk_score = Column(Integer, nullable=False)
    recommendation = Column(String(10), nullable=False)  # ALLOW, WARN, BLOCK
    reasoning = Column(Text, nullable=True)
    model_used = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    vault = relationship("Vault", back_populates="risk_analyses")


class AuditLog(Base):
    """Database model for audit logs (mirrors on-chain data)."""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    vault_id = Column(Integer, ForeignKey("vaults.id"), nullable=False)
    user_address = Column(String(58), nullable=False)
    risk_score = Column(Integer, nullable=False)
    decision = Column(Integer, nullable=False)  # 0=BLOCKED, 1=ALLOWED, 2=FROZEN
    action_type = Column(String(100), nullable=True)
    timestamp = Column(Integer, nullable=False)  # Blockchain round number
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    vault = relationship("Vault", back_populates="audit_logs")


class Transaction(Base):
    """Database model for tracked transactions."""
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    vault_id = Column(Integer, ForeignKey("vaults.id"), nullable=True)
    tx_id = Column(String(64), unique=True, index=True, nullable=False)
    sender = Column(String(58), nullable=False)
    recipient = Column(String(58), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String(50), nullable=False)
    status = Column(String(20), default="pending", nullable=False)  # pending, allowed, blocked
    risk_score = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Async database engine
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def get_db() -> AsyncSession:
    """
    Dependency for getting async database sessions.
    
    Yields:
        AsyncSession: Database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize the database by creating all tables."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_db() -> None:
    """Drop all database tables (use with caution)."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
