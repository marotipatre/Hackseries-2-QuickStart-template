"""
Blockchain service for interacting with GuardianVault smart contract.
"""

import logging
from typing import Any, Dict, Optional, Tuple
from algokit_utils import (
    AlgorandClient,
    get_algod_client,
    get_indexer_client,
    AlgoClientConfig,
)
from algosdk.v2client.algod import AlgodClient
from algosdk.v2client.indexer import IndexerClient

from app.config import settings

logger = logging.getLogger(__name__)


class BlockchainService:
    """
    Service for interacting with GuardianVault smart contract
    and Algorand blockchain.
    """
    
    def __init__(self) -> None:
        """Initialize the blockchain service."""
        self.algod_client = self._get_algod_client()
        self.indexer_client = self._get_indexer_client()
        self.algorand_client = AlgorandClient.from_clients(
            algod=self.algod_client,     # <--- Correct keyword
            indexer=self.indexer_client, # <--- Correct keyword
        )
        self.app_id = settings.GUARDIAN_VAULT_APP_ID
    
    def _get_algod_client(self) -> AlgodClient:
        """Get the Algorand algod client."""
        config = AlgoClientConfig(
            server=settings.ALGORAND_NODE_URL or "https://testnet-api.algonode.cloud",
            token=""
        )
        return get_algod_client(config)
    
    def _get_indexer_client(self) -> IndexerClient:
        """Get the Algorand indexer client."""
        config = AlgoClientConfig(
            server=settings.ALGORAND_INDEXER_URL or "https://testnet-idx.algonode.cloud",
            token=""
        )
        return get_indexer_client(config)
    
    async def get_vault_status(
        self,
        user_address: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get the status of a user's vault.
        
        Args:
            user_address: The user's Algorand address
        
        Returns:
            Dictionary with vault status or None if vault doesn't exist
        """
        if not self.app_id:
            logger.warning("Contract app ID not configured")
            return None
        
        try:
            # Import the client dynamically to avoid import errors if contract not built
            from smart_contracts.artifacts.guardian_vault.client import GuardianVaultClient
            
            client = GuardianVaultClient(
                algod_client=self.algod_client,
                indexer_client=self.indexer_client,
                app_id=self.app_id,
            )
            
            # Call the get_vault_status method
            result = client.send.get_vault_status(
                args=[user_address],
                sender=user_address,
            )
            
            # Return vault status
            return {
                "threshold": int(result.return_value[0]),
                "risk_score": int(result.return_value[1]),
                "is_frozen": bool(result.return_value[2]),
            }
        except Exception as e:
            logger.error(f"Failed to get vault status: {e}")
            return None
    
    async def update_risk_score(
        self,
        user_address: str,
        risk_score: int,
        ai_authorizer_address: str
    ) -> bool:
        """
        Update a user's risk score on-chain.
        
        Args:
            user_address: The user's Algorand address
            risk_score: The new risk score (0-100)
            ai_authorizer_address: The AI authorizer's address
        
        Returns:
            True if successful, False otherwise
        """
        if not self.app_id:
            logger.warning("Contract app ID not configured")
            return False
        
        try:
            from smart_contracts.artifacts.guardian_vault.client import GuardianVaultClient
            
            client = GuardianVaultClient(
                algod_client=self.algod_client,
                indexer_client=self.indexer_client,
                app_id=self.app_id,
            )
            
            # Update risk score
            result = client.send.update_risk_score(
                args=[user_address, risk_score],
                sender=ai_authorizer_address,
            )
            
            return bool(result.return_value)
        except Exception as e:
            logger.error(f"Failed to update risk score: {e}")
            return False
    
    async def check_and_execute(
        self,
        user_address: str,
        action_type: str
    ) -> bool:
        """
        Check if a transaction is allowed based on risk score.
        
        Args:
            user_address: The user's Algorand address
            action_type: Description of the action
        
        Returns:
            True if allowed, False if blocked
        """
        if not self.app_id:
            logger.warning("Contract app ID not configured")
            return False
        
        try:
            from smart_contracts.artifacts.guardian_vault.client import GuardianVaultClient
            
            client = GuardianVaultClient(
                algod_client=self.algod_client,
                indexer_client=self.indexer_client,
                app_id=self.app_id,
            )
            
            result = client.send.check_and_execute(
                args=[action_type],
                sender=user_address,
            )
            
            return bool(result.return_value)
        except Exception as e:
            logger.error(f"Failed to check and execute: {e}")
            return False
    
    async def freeze_vault(
        self,
        user_address: str,
        freezer_address: str
    ) -> bool:
        """
        Freeze a user's vault.
        
        Args:
            user_address: The user's Algorand address
            freezer_address: Address performing the freeze (owner or AI)
        
        Returns:
            True if successful, False otherwise
        """
        if not self.app_id:
            logger.warning("Contract app ID not configured")
            return False
        
        try:
            from smart_contracts.artifacts.guardian_vault.client import GuardianVaultClient
            
            client = GuardianVaultClient(
                algod_client=self.algod_client,
                indexer_client=self.indexer_client,
                app_id=self.app_id,
            )
            
            result = client.send.freeze_vault(
                args=[user_address],
                sender=freezer_address,
            )
            
            return bool(result.return_value)
        except Exception as e:
            logger.error(f"Failed to freeze vault: {e}")
            return False
    
    async def unfreeze_vault(
        self,
        user_address: str,
        owner_address: str
    ) -> bool:
        """
        Unfreeze a user's vault.
        
        Args:
            user_address: The user's Algorand address
            owner_address: The contract owner's address
        
        Returns:
            True if successful, False otherwise
        """
        if not self.app_id:
            logger.warning("Contract app ID not configured")
            return False
        
        try:
            from smart_contracts.artifacts.guardian_vault.client import GuardianVaultClient
            
            client = GuardianVaultClient(
                algod_client=self.algod_client,
                indexer_client=self.indexer_client,
                app_id=self.app_id,
            )
            
            result = client.send.unfreeze_vault(
                args=[user_address],
                sender=owner_address,
            )
            
            return bool(result.return_value)
        except Exception as e:
            logger.error(f"Failed to unfreeze vault: {e}")
            return False
    
    async def get_audit_log(
        self,
        index: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get a specific audit log entry.
        
        Args:
            index: The audit log entry index
        
        Returns:
            Dictionary with audit entry or None if not found
        """
        if not self.app_id:
            logger.warning("Contract app ID not configured")
            return None
        
        try:
            from smart_contracts.artifacts.guardian_vault.client import GuardianVaultClient
            
            client = GuardianVaultClient(
                algod_client=self.algod_client,
                indexer_client=self.indexer_client,
                app_id=self.app_id,
            )
            
            result = client.send.get_audit_entry(
                args=[index],
            )
            
            return {
                "user_address": result.return_value[0],
                "risk_score": int(result.return_value[1]),
                "decision": int(result.return_value[2]),
                "timestamp": int(result.return_value[3]),
            }
        except Exception as e:
            logger.error(f"Failed to get audit log: {e}")
            return None
    
    async def get_audit_count(self) -> int:
        """
        Get the total number of audit log entries.
        
        Returns:
            The audit counter value
        """
        if not self.app_id:
            logger.warning("Contract app ID not configured")
            return 0
        
        try:
            from smart_contracts.artifacts.guardian_vault.client import GuardianVaultClient
            
            client = GuardianVaultClient(
                algod_client=self.algod_client,
                indexer_client=self.indexer_client,
                app_id=self.app_id,
            )
            
            result = client.send.get_audit_count()
            return int(result.return_value)
        except Exception as e:
            logger.error(f"Failed to get audit count: {e}")
            return 0
    
    async def get_account_balance(self, address: str) -> int:
        """
        Get the ALGO balance of an account.
        
        Args:
            address: The account address
        
        Returns:
            Balance in microALGOs
        """
        try:
            account_info = await self.algod_client.account_info(address)
            return int(account_info.get("amount", 0))
        except Exception as e:
            logger.error(f"Failed to get account balance: {e}")
            return 0


# Singleton instance
_blockchain_service: Optional[BlockchainService] = None


def get_blockchain_service() -> BlockchainService:
    """Get or create the blockchain service singleton instance."""
    global _blockchain_service
    if _blockchain_service is None:
        _blockchain_service = BlockchainService()
    return _blockchain_service
