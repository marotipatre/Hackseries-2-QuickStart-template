from algopy import *
from algopy.arc4 import abimethod, String as Arc4String


class PiggyBank(ARC4Contract):
    """
    PiggyBank Smart Contract - A savings project with a custom token (like memecoin)
    Users can:
    - Create a piggybank project with a custom token
    - Deposit ALGO to the piggybank
    - Withdraw ALGO from the piggybank
    - The project creates an ASA token for trading on Tinyman
    """

    # Project state
    project_name: String
    project_description: String
    token_id: UInt64
    token_name: String
    token_symbol: String
    token_total_supply: UInt64
    goal_amount: UInt64
    total_deposited: UInt64
    creator: Account
    is_active: Bytes

    def __init__(self) -> None:
        """Initializes contract storages on deployment"""
        self.deposits = BoxMap(Account, UInt64, key_prefix="d_")
        self.project_name = String("")
        self.project_description = String("")
        self.token_id = UInt64(0)
        self.token_name = String("")
        self.token_symbol = String("")
        self.token_total_supply = UInt64(0)
        self.goal_amount = UInt64(0)
        self.total_deposited = UInt64(0)
        self.creator = Global.zero_address
        self.is_active = Bytes(b"\x00")

    @abimethod()
    def initialize_project(
        self,
        name: String,
        description: String,
        token_name: String,
        token_symbol: String,
        token_supply: UInt64,
        goal: UInt64,
        mbr_pay: gtxn.PaymentTransaction,
    ) -> UInt64:
        """
        Initialize a new piggybank project with its token
        
        Args:
            name: Project name
            description: Project description  
            token_name: Name of the project token
            token_symbol: Symbol of the project token (max 8 chars)
            token_supply: Total supply of tokens to mint
            goal: Goal amount in microAlgos
            mbr_pay: Payment for minimum balance requirement
        
        Returns:
            The created token (ASA) ID
        """
        # Ensure project hasn't been initialized yet
        assert self.is_active == Bytes(b"\x00"), "Project already initialized"
        
        # Validate MBR payment
        assert mbr_pay.receiver == Global.current_application_address, "Payment must be to contract"
        assert mbr_pay.amount >= 200000, "Insufficient MBR payment"  # 0.2 ALGO for ASA creation
        
        # Set project details
        self.project_name = name
        self.project_description = description
        self.token_name = token_name
        self.token_symbol = token_symbol
        self.token_total_supply = token_supply
        self.goal_amount = goal
        self.creator = Txn.sender
        self.is_active = Bytes(b"\x01")
        
        # Create the project token (ASA)
        token = (
            itxn.AssetConfig(
                total=token_supply,
                decimals=6,
                unit_name=token_symbol,
                asset_name=token_name,
                url="ipfs://",
                manager=Txn.sender,
                reserve=Txn.sender,
                freeze=Txn.sender,
                clawback=Txn.sender,
                fee=0,
            )
            .submit()
        )
        
        self.token_id = token.created_asset.id
        
        return self.token_id

    @abimethod()
    def deposit(self, pay_txn: gtxn.PaymentTransaction) -> UInt64:
        """
        Deposit ALGO to the piggybank
        
        Args:
            pay_txn: Payment transaction with ALGO to deposit
            
        Returns:
            Updated total deposits for the sender
        """
        assert self.is_active == Bytes(b"\x01"), "Project not active"
        assert pay_txn.receiver == Global.current_application_address, "Receiver must be the contract"
        assert pay_txn.amount > 0, "Deposit amount must be greater than zero"

        amount, exists = self.deposits.maybe(pay_txn.sender)
        if exists:
            self.deposits[pay_txn.sender] = amount + pay_txn.amount
        else:
            self.deposits[pay_txn.sender] = pay_txn.amount

        self.total_deposited += pay_txn.amount
        return self.deposits[pay_txn.sender]

    @abimethod()
    def withdraw(self, amount: UInt64) -> UInt64:
        """
        Withdraw ALGO from the piggybank
        
        Args:
            amount: Amount in microAlgos to withdraw
            
        Returns:
            Remaining balance for the sender
        """
        assert self.is_active == Bytes(b"\x01"), "Project not active"
        current, exists = self.deposits.maybe(Txn.sender)
        assert exists, "No deposits found for this account"
        assert amount > 0, "Withdrawal amount must be greater than zero"
        assert amount <= current, "Withdrawal amount exceeds balance"

        itxn.Payment(receiver=Txn.sender, amount=amount, fee=0).submit()

        remaining = current - amount
        self.total_deposited -= amount
        
        if remaining == UInt64(0):
            del self.deposits[Txn.sender]
        else:
            self.deposits[Txn.sender] = remaining

        return remaining

    @abimethod()
    def claim_tokens(self, token_amount: UInt64) -> UInt64:
        """
        Claim project tokens based on deposit ratio
        Users can claim tokens proportional to their deposits
        
        Args:
            token_amount: Amount of tokens to claim
            
        Returns:
            Amount of tokens transferred
        """
        assert self.is_active == Bytes(b"\x01"), "Project not active"
        assert self.token_id > 0, "Token not created yet"
        
        max_claimable = self.token_total_supply
        if Txn.sender != self.creator:
            current_deposit, exists = self.deposits.maybe(Txn.sender)
            assert exists, "No deposits found for this account"
            assert current_deposit > 0, "No deposits to claim tokens for"

            # Simple token distribution: 1 token per 1000 microAlgos deposited
            max_claimable = current_deposit // 1000
        assert token_amount <= max_claimable, "Claiming more than allowed"
        
        # Transfer tokens to sender
        itxn.AssetTransfer(
            asset_receiver=Txn.sender,
            asset_amount=token_amount,
            xfer_asset=self.token_id,
            fee=0,
        ).submit()
        
        return token_amount

    @abimethod()
    def opt_in_token(self, asset: Asset, mbr_pay: gtxn.PaymentTransaction) -> bool:
        """
        Opt-in to receive the project token
        User must call this before claiming tokens
        
        Args:
            asset: The token asset to opt-in to
            mbr_pay: Payment for minimum balance requirement
        
        Returns:
            True if opt-in successful
        """
        assert mbr_pay.receiver == Global.current_application_address, "Payment must be to contract"
        assert mbr_pay.amount >= 100000, "Insufficient MBR payment"
        assert asset.id == self.token_id, "Invalid token"
        
        return True

    @abimethod(readonly=True)
    def get_project_info(self) -> tuple[String, String, UInt64, UInt64, UInt64, UInt64]:
        """
        Get project information
        
        Returns:
            Tuple of (name, description, token_id, goal_amount, total_deposited, token_supply)
        """
        return (
            self.project_name,
            self.project_description,
            self.token_id,
            self.goal_amount,
            self.total_deposited,
            self.token_total_supply,
        )

    @abimethod(readonly=True)
    def get_deposit(self, account: Account) -> UInt64:
        """
        Get deposit amount for an account
        
        Args:
            account: The account to check
            
        Returns:
            Deposit amount in microAlgos
        """
        amount, exists = self.deposits.maybe(account)
        if exists:
            return amount
        return UInt64(0)

    @abimethod(readonly=True)
    def is_goal_reached(self) -> bool:
        """Check if the funding goal has been reached"""
        return self.total_deposited >= self.goal_amount
