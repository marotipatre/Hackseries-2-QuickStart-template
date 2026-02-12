"""
GuardianVault Smart Contract
AI-Powered DeFi Risk & Compliance Assistant on Algorand

This contract provides:
- Risk score storage and management
- AI-authorized risk score updates
- Transaction enforcement based on risk thresholds
- Emergency freeze/unfreeze functionality
- Immutable audit logging
"""

from algopy import *
from algopy.arc4 import abimethod


class GuardianVault(ARC4Contract):
    """
    Smart contract for AI-powered DeFi risk management.
    
    The contract enforces risk-based transaction controls while maintaining
    user sovereignty through configurable thresholds and owner controls.
    """
    
    # Global state variables
    owner: Address  # Contract owner with admin privileges
    ai_authorizer: Address  # Authorized AI service address for risk updates
    audit_counter: UInt64  # Counter for audit log entries
    
    # BoxMap storage for user-specific data
    # Maps user address to their vault configuration
    vaults: BoxMap[Address, UInt64]  # User -> Risk Threshold
    
    # Maps user address to their current risk score
    risk_scores: BoxMap[Address, UInt64]  # User -> Current Risk Score (0-100)
    
    # Maps user address to frozen status
    is_frozen: BoxMap[Address, Bool]  # User -> Frozen Status
    
    # Audit log: counter -> (user_address, risk_score, decision, timestamp)
    # decision: 0 = BLOCKED, 1 = ALLOWED, 2 = FROZEN
    audit_log: BoxMap[UInt64, (Address, UInt64, UInt64, UInt64)]
    
    def __init__(self) -> None:
        """Initialize contract storage on deployment"""
        self.vaults = BoxMap[Address, UInt64](key_prefix=b"vault_")
        self.risk_scores = BoxMap[Address, UInt64](key_prefix=b"risk_")
        self.is_frozen = BoxMap[Address, Bool](key_prefix=b"frozen_")
        self.audit_log = BoxMap[UInt64, (Address, UInt64, UInt64, UInt64)](key_prefix=b"audit_")
        self.audit_counter = UInt64(0)
    
    @abimethod(create="require")
    def create(self, owner: Address, ai_authorizer: Address) -> None:
        """
        Initialize the contract with owner and AI authorizer addresses.
        
        Args:
            owner: Address with admin privileges (freeze/unfreeze)
            ai_authorizer: Address authorized to update risk scores
        """
        self.owner = owner
        self.ai_authorizer = ai_authorizer
        self.audit_counter = UInt64(0)
    
    @abimethod()
    def create_vault(self, risk_threshold: UInt64) -> UInt64:
        """
        Create a new guardian vault for the sender.
        
        Args:
            risk_threshold: User's personal risk threshold (0-100)
                          Transactions with risk score above this will be blocked
        
        Returns:
            UInt64(1) on success
        
        Raises:
            Asserts if vault already exists for sender
        """
        # Check if vault already exists
        existing_vault, exists = self.vaults.maybe(Txn.sender)
        assert not exists, "Vault already exists for this address"
        
        # Validate threshold
        assert risk_threshold <= UInt64(100), "Risk threshold must be 0-100"
        
        # Create vault with default values
        self.vaults[Txn.sender] = risk_threshold
        self.risk_scores[Txn.sender] = UInt64(0)  # Start with zero risk
        self.is_frozen[Txn.sender] = Bool(False)
        
        # Log vault creation
        self._log_decision(Txn.sender, UInt64(0), UInt64(1))
        
        return UInt64(1)
    
    @abimethod()
    def update_risk_score(self, user: Address, score: UInt64) -> Bool:
        """
        AI-authorized method to update a user's risk score.
        
        Only the authorized AI address can call this method.
        
        Args:
            user: Address of the user whose risk score to update
            score: New risk score (0-100)
        
        Returns:
            Bool(True) on success
        
        Raises:
            Asserts if caller is not the authorized AI address
            Asserts if vault does not exist for user
            Asserts if score is invalid
        """
        # Only authorized AI can update scores
        assert Txn.sender == self.ai_authorizer, "Only authorized AI can update risk scores"
        
        # Check vault exists
        _, exists = self.vaults.maybe(user)
        assert exists, "Vault does not exist for this user"
        
        # Validate score
        assert score <= UInt64(100), "Risk score must be 0-100"
        
        # Update risk score
        self.risk_scores[user] = score
        
        return Bool(True)
    
    @abimethod()
    def check_and_execute(self, action_type: String) -> Bool:
        """
        Check risk score and allow or block transaction execution.
        
        This is the core enforcement mechanism. It evaluates the user's
        current risk score against their threshold and decides whether
        to allow or block the transaction.
        
        Args:
            action_type: Description of the action being attempted
        
        Returns:
            Bool(True) if transaction is allowed
            Bool(False) if transaction is blocked
        
        Raises:
            Asserts if vault does not exist
            Asserts if vault is frozen
        """
        # Check vault exists
        threshold, exists = self.vaults.maybe(Txn.sender)
        assert exists, "No vault found for this address"
        
        # Check if frozen
        frozen, _ = self.is_frozen.maybe(Txn.sender)
        assert not frozen, "Vault is frozen - transactions blocked"
        
        # Get current risk score
        current_score, _ = self.risk_scores.maybe(Txn.sender)
        
        # Risk evaluation
        if current_score > threshold:
            # High risk - block and log
            self._log_decision(Txn.sender, current_score, UInt64(0))
            return Bool(False)
        
        # Low/medium risk - allow and log
        self._log_decision(Txn.sender, current_score, UInt64(1))
        return Bool(True)
    
    @abimethod()
    def freeze_vault(self, user: Address) -> Bool:
        """
        Emergency freeze a vault.
        
        Can be called by the contract owner or the authorized AI address.
        Freezing prevents all transactions from the vault.
        
        Args:
            user: Address of the vault to freeze
        
        Returns:
            Bool(True) on success
        
        Raises:
            Asserts if caller is not owner or AI authorizer
            Asserts if vault does not exist
        """
        # Only owner or AI can freeze
        assert (
            Txn.sender == self.owner or 
            Txn.sender == self.ai_authorizer
        ), "Only owner or authorized AI can freeze vaults"
        
        # Check vault exists
        _, exists = self.vaults.maybe(user)
        assert exists, "Vault does not exist for this user"
        
        # Freeze vault
        self.is_frozen[user] = Bool(True)
        
        # Log freeze action
        self._log_decision(user, UInt64(0), UInt64(2))
        
        return Bool(True)
    
    @abimethod()
    def unfreeze_vault(self, user: Address) -> Bool:
        """
        Unfreeze a vault.
        
        Only the contract owner can unfreeze vaults.
        
        Args:
            user: Address of the vault to unfreeze
        
        Returns:
            Bool(True) on success
        
        Raises:
            Asserts if caller is not the owner
            Asserts if vault does not exist
        """
        # Only owner can unfreeze
        assert Txn.sender == self.owner, "Only owner can unfreeze vaults"
        
        # Check vault exists
        _, exists = self.vaults.maybe(user)
        assert exists, "Vault does not exist for this user"
        
        # Unfreeze vault
        self.is_frozen[user] = Bool(False)
        
        # Log unfreeze action
        self._log_decision(user, UInt64(0), UInt64(1))
        
        return Bool(True)
    
    @abimethod()
    def update_threshold(self, new_threshold: UInt64) -> Bool:
        """
        Update the user's personal risk threshold.
        
        Users can adjust their own risk tolerance.
        
        Args:
            new_threshold: New risk threshold (0-100)
        
        Returns:
            Bool(True) on success
        
        Raises:
            Asserts if vault does not exist
            Asserts if threshold is invalid
        """
        # Check vault exists
        _, exists = self.vaults.maybe(Txn.sender)
        assert exists, "No vault found for this address"
        
        # Validate threshold
        assert new_threshold <= UInt64(100), "Risk threshold must be 0-100"
        
        # Update threshold
        self.vaults[Txn.sender] = new_threshold
        
        return Bool(True)
    
    @abimethod()
    def get_vault_status(self, user: Address) -> (UInt64, UInt64, Bool):
        """
        Get the current status of a vault.
        
        Args:
            user: Address of the vault to query
        
        Returns:
            Tuple of (risk_threshold, current_risk_score, is_frozen)
        
        Raises:
            Asserts if vault does not exist
        """
        # Check vault exists
        threshold, exists = self.vaults.maybe(user)
        assert exists, "Vault does not exist for this user"
        
        # Get current values
        score, _ = self.risk_scores.maybe(user)
        frozen, _ = self.is_frozen.maybe(user)
        
        return (threshold, score, frozen)
    
    @abimethod()
    def get_audit_entry(self, index: UInt64) -> (Address, UInt64, UInt64, UInt64):
        """
        Retrieve a specific audit log entry.
        
        Args:
            index: The audit log entry index
        
        Returns:
            Tuple of (user_address, risk_score, decision, timestamp)
        
        Raises:
            Asserts if index is out of bounds
        """
        assert index < self.audit_counter, "Audit entry not found"
        
        entry, _ = self.audit_log.maybe(index)
        return entry
    
    @abimethod()
    def get_audit_count(self) -> UInt64:
        """
        Get the total number of audit log entries.
        
        Returns:
            The current audit counter value
        """
        return self.audit_counter
    
    @abimethod()
    def update_ai_authorizer(self, new_authorizer: Address) -> Bool:
        """
        Update the authorized AI address.
        
        Only the contract owner can change the AI authorizer.
        
        Args:
            new_authorizer: New address authorized to update risk scores
        
        Returns:
            Bool(True) on success
        
        Raises:
            Asserts if caller is not the owner
        """
        assert Txn.sender == self.owner, "Only owner can update AI authorizer"
        self.ai_authorizer = new_authorizer
        return Bool(True)
    
    def _log_decision(self, user: Address, risk_score: UInt64, decision: UInt64) -> None:
        """
        Internal method to log a decision to the audit log.
        
        Args:
            user: Address of the user
            risk_score: Risk score at time of decision
            decision: 0 = BLOCKED, 1 = ALLOWED, 2 = FROZEN
        """
        # Get current timestamp (using Global.round for simplicity)
        timestamp = Global.round
        
        # Store audit entry
        self.audit_log[self.audit_counter] = (user, risk_score, decision, timestamp)
        
        # Increment counter
        self.audit_counter += UInt64(1)
