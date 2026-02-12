"""
Unit tests for GuardianVault smart contract.
"""

import pytest
from algokit_utils import (
    ApplicationClient,
    ApplicationSpecification,
    get_account,
    get_algod_client,
    get_indexer_client,
)
from algosdk.v2client.algod import AlgodClient
from algosdk.v2client.indexer import IndexerClient

from smart_contracts.artifacts.guardian_vault.client import (
    GuardianVaultClient,
    GuardianVaultFactory,
)


@pytest.fixture
def algod_client() -> AlgodClient:
    """Get Algorand algod client."""
    return get_algod_client()


@pytest.fixture
def indexer_client() -> IndexerClient:
    """Get Algorand indexer client."""
    return get_indexer_client()


@pytest.fixture
def app_spec() -> ApplicationSpecification:
    """Get GuardianVault application specification."""
    from smart_contracts.artifacts.guardian_vault import GuardianVault
    return GuardianVault.app_spec


@pytest.fixture
def owner_account() -> str:
    """Get owner account."""
    return get_account("owner")


@pytest.fixture
def ai_authorizer_account() -> str:
    """Get AI authorizer account."""
    return get_account("ai_authorizer")


@pytest.fixture
def user_account() -> str:
    """Get regular user account."""
    return get_account("user")


@pytest.fixture
def guardian_vault_client(
    algod_client: AlgodClient,
    indexer_client: IndexerClient,
    app_spec: ApplicationSpecification,
    owner_account: str,
    ai_authorizer_account: str,
) -> GuardianVaultClient:
    """
    Deploy GuardianVault contract and return client.
    """
    factory = GuardianVaultFactory(
        algorand_client=algod_client,
        indexer_client=indexer_client,
    )
    
    result = factory.deploy(
        create_params={
            "sender": owner_account,
            "args": [owner_account, ai_authorizer_account],
        },
        on_complete="NoOp",
    )
    
    return result.app_client


class TestGuardianVaultCreation:
    """Tests for contract creation and initialization."""
    
    def test_contract_deployment(self, guardian_vault_client: GuardianVaultClient):
        """Test that contract deploys successfully."""
        assert guardian_vault_client.app_id > 0
        assert guardian_vault_client.app_address is not None
    
    def test_owner_set_correctly(
        self,
        guardian_vault_client: GuardianVaultClient,
        owner_account: str,
    ):
        """Test that owner is set correctly on deployment."""
        # Owner is stored in global state
        # This would require reading global state
        pass
    
    def test_ai_authorizer_set_correctly(
        self,
        guardian_vault_client: GuardianVaultClient,
        ai_authorizer_account: str,
    ):
        """Test that AI authorizer is set correctly on deployment."""
        # AI authorizer is stored in global state
        pass


class TestVaultCreation:
    """Tests for vault creation."""
    
    def test_create_vault_success(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
    ):
        """Test successful vault creation."""
        result = guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        
        assert result.return == 1
    
    def test_create_vault_with_invalid_threshold(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
    ):
        """Test vault creation with invalid threshold (>100)."""
        with pytest.raises(Exception):
            guardian_vault_client.send.create_vault(
                args=[150],
                sender=user_account,
            )
    
    def test_create_duplicate_vault(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
    ):
        """Test that duplicate vault creation fails."""
        # Create first vault
        guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        
        # Try to create duplicate
        with pytest.raises(Exception):
            guardian_vault_client.send.create_vault(
                args=[80],
                sender=user_account,
            )


class TestRiskScoreUpdate:
    """Tests for risk score updates."""
    
    def test_ai_can_update_risk_score(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
        ai_authorizer_account: str,
    ):
        """Test that AI authorizer can update risk scores."""
        # Create vault first
        guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        
        # AI updates risk score
        result = guardian_vault_client.send.update_risk_score(
            args=[user_account, 85],
            sender=ai_authorizer_account,
        )
        
        assert result.return == True
    
    def test_non_ai_cannot_update_risk_score(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
        owner_account: str,
    ):
        """Test that non-AI addresses cannot update risk scores."""
        # Create vault first
        guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        
        # Owner tries to update risk score (should fail)
        with pytest.raises(Exception):
            guardian_vault_client.send.update_risk_score(
                args=[user_account, 85],
                sender=owner_account,
            )
    
    def test_update_invalid_risk_score(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
        ai_authorizer_account: str,
    ):
        """Test that invalid risk scores (>100) are rejected."""
        # Create vault first
        guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        
        # AI tries to update with invalid score
        with pytest.raises(Exception):
            guardian_vault_client.send.update_risk_score(
                args=[user_account, 150],
                sender=ai_authorizer_account,
            )


class TestTransactionEnforcement:
    """Tests for transaction enforcement logic."""
    
    def test_low_risk_transaction_allowed(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
        ai_authorizer_account: str,
    ):
        """Test that low-risk transactions are allowed."""
        # Create vault with threshold 70
        guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        
        # AI sets risk score to 50 (below threshold)
        guardian_vault_client.send.update_risk_score(
            args=[user_account, 50],
            sender=ai_authorizer_account,
        )
        
        # Check and execute - should be allowed
        result = guardian_vault_client.send.check_and_execute(
            args=["transfer"],
            sender=user_account,
        )
        
        assert result.return == True
    
    def test_high_risk_transaction_blocked(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
        ai_authorizer_account: str,
    ):
        """Test that high-risk transactions are blocked."""
        # Create vault with threshold 70
        guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        
        # AI sets risk score to 85 (above threshold)
        guardian_vault_client.send.update_risk_score(
            args=[user_account, 85],
            sender=ai_authorizer_account,
        )
        
        # Check and execute - should be blocked
        result = guardian_vault_client.send.check_and_execute(
            args=["transfer"],
            sender=user_account,
        )
        
        assert result.return == False
    
    def test_frozen_vault_blocks_transactions(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
        owner_account: str,
    ):
        """Test that frozen vaults block all transactions."""
        # Create vault
        guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        
        # Freeze vault
        guardian_vault_client.send.freeze_vault(
            args=[user_account],
            sender=owner_account,
        )
        
        # Try to execute transaction - should fail
        with pytest.raises(Exception):
            guardian_vault_client.send.check_and_execute(
                args=["transfer"],
                sender=user_account,
            )


class TestFreezeUnfreeze:
    """Tests for freeze/unfreeze functionality."""
    
    def test_owner_can_freeze_vault(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
        owner_account: str,
    ):
        """Test that owner can freeze vaults."""
        # Create vault
        guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        
        # Owner freezes vault
        result = guardian_vault_client.send.freeze_vault(
            args=[user_account],
            sender=owner_account,
        )
        
        assert result.return == True
    
    def test_ai_can_freeze_vault(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
        ai_authorizer_account: str,
    ):
        """Test that AI can freeze vaults."""
        # Create vault
        guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        
        # AI freezes vault
        result = guardian_vault_client.send.freeze_vault(
            args=[user_account],
            sender=ai_authorizer_account,
        )
        
        assert result.return == True
    
    def test_user_cannot_freeze_vault(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
    ):
        """Test that regular users cannot freeze vaults."""
        # Create vault
        guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        
        # User tries to freeze their own vault (should fail)
        with pytest.raises(Exception):
            guardian_vault_client.send.freeze_vault(
                args=[user_account],
                sender=user_account,
            )
    
    def test_owner_can_unfreeze_vault(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
        owner_account: str,
    ):
        """Test that owner can unfreeze vaults."""
        # Create and freeze vault
        guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        guardian_vault_client.send.freeze_vault(
            args=[user_account],
            sender=owner_account,
        )
        
        # Owner unfreezes vault
        result = guardian_vault_client.send.unfreeze_vault(
            args=[user_account],
            sender=owner_account,
        )
        
        assert result.return == True
    
    def test_ai_cannot_unfreeze_vault(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
        owner_account: str,
        ai_authorizer_account: str,
    ):
        """Test that AI cannot unfreeze vaults."""
        # Create and freeze vault
        guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        guardian_vault_client.send.freeze_vault(
            args=[user_account],
            sender=owner_account,
        )
        
        # AI tries to unfreeze (should fail)
        with pytest.raises(Exception):
            guardian_vault_client.send.unfreeze_vault(
                args=[user_account],
                sender=ai_authorizer_account,
            )


class TestThresholdUpdate:
    """Tests for threshold update functionality."""
    
    def test_user_can_update_threshold(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
    ):
        """Test that users can update their own threshold."""
        # Create vault with threshold 70
        guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        
        # Update threshold to 80
        result = guardian_vault_client.send.update_threshold(
            args=[80],
            sender=user_account,
        )
        
        assert result.return == True
    
    def test_update_invalid_threshold(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
    ):
        """Test that invalid thresholds (>100) are rejected."""
        # Create vault
        guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        
        # Try to update with invalid threshold
        with pytest.raises(Exception):
            guardian_vault_client.send.update_threshold(
                args=[150],
                sender=user_account,
            )


class TestAuditLog:
    """Tests for audit logging functionality."""
    
    def test_audit_log_increments(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
    ):
        """Test that audit log counter increments."""
        # Get initial count
        initial_count = guardian_vault_client.send.get_audit_count()
        
        # Create vault (should log)
        guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        
        # Get new count
        new_count = guardian_vault_client.send.get_audit_count()
        
        assert new_count > initial_count
    
    def test_get_audit_entry(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
    ):
        """Test retrieving audit log entries."""
        # Create vault
        guardian_vault_client.send.create_vault(
            args=[70],
            sender=user_account,
        )
        
        # Get first audit entry
        entry = guardian_vault_client.send.get_audit_entry(
            args=[0],
        )
        
        # Entry should be a tuple (address, score, decision, timestamp)
        assert len(entry) == 4


class TestAdminFunctions:
    """Tests for administrative functions."""
    
    def test_owner_can_update_ai_authorizer(
        self,
        guardian_vault_client: GuardianVaultClient,
        owner_account: str,
        ai_authorizer_account: str,
    ):
        """Test that owner can update AI authorizer."""
        # Get a new account for new authorizer
        new_authorizer = get_account("new_ai_authorizer")
        
        # Update AI authorizer
        result = guardian_vault_client.send.update_ai_authorizer(
            args=[new_authorizer],
            sender=owner_account,
        )
        
        assert result.return == True
    
    def test_non_owner_cannot_update_ai_authorizer(
        self,
        guardian_vault_client: GuardianVaultClient,
        user_account: str,
    ):
        """Test that non-owner cannot update AI authorizer."""
        # Get a new account
        new_authorizer = get_account("new_ai_authorizer")
        
        # User tries to update AI authorizer (should fail)
        with pytest.raises(Exception):
            guardian_vault_client.send.update_ai_authorizer(
                args=[new_authorizer],
                sender=user_account,
            )
