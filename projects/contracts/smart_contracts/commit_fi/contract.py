from algopy import *
from algopy.arc4 import abimethod


class CommitFi(ARC4Contract):
    """
    Commit-Fi: Accountability Staking dApp for Study Circles
    
    Users form study circles, stake ALGO, set goals and deadlines.
    Winners get refunds + rewards, losers lose their stake.
    """
    
    # === GLOBAL STATE SCHEMA ===
    # Contract-wide variables that apply to all participants
    
    creator: Account  # Address of the study circle creator/admin
    stake_amount: UInt64  # Required ALGO stake amount per participant (in microAlgos)
    deadline: UInt64  # Unix timestamp when the challenge ends
    max_participants: UInt64  # Maximum number of participants allowed
    current_participants: UInt64  # Current number of participants who have joined
    total_pooled_stake: UInt64  # Total ALGO staked by all participants
    challenge_status: UInt64  # Current status: 0=Setup, 1=Active, 2=Completed, 3=Cancelled

    def __init__(self) -> None:
        """Initialize contract storage on deployment"""
        # Set default values for global state
        self.creator = Global.creator_address  # Deployer becomes creator
        self.stake_amount = UInt64(0)  # To be set by creator
        self.deadline = UInt64(0)  # To be set by creator
        self.max_participants = UInt64(10)  # Default max participants
        self.current_participants = UInt64(0)
        self.total_pooled_stake = UInt64(0)
        self.challenge_status = UInt64(0)  # Start in Setup mode
        
        # Initialize local state storage for participants
        # Each participant's data is packed into a single UInt64:
        # bit 0: has_joined (1 if user has staked and joined)
        # bit 1: has_submitted_proof (1 if user submitted completion proof)
        # bit 2: is_verified (1 if creator verified successful completion)
        # bits 3-7: reputation_score (0-31, 5 bits for future trust assessment)
        # bits 8-63: reserved for future use
        self.participant_data = BoxMap(Account, UInt64, key_prefix="")
