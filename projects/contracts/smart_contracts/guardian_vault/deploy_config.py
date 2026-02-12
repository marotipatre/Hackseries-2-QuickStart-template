"""
Deployment configuration for GuardianVault smart contract.
"""

from algokit_utils import (
    ApplicationClient,
    ApplicationSpecification,
    get_account,
    get_algod_client,
    get_indexer_client,
)
from algokit_utils.config import config
from algosdk.v2client.algod import AlgodClient
from algosdk.v2client.indexer import IndexerClient

from smart_contracts.artifacts.guardian_vault.client import (
    GuardianVaultClient,
    GuardianVaultFactory,
)

# Configure deployment based on network
config.configure(
    deploy_environment="localnet",
    # For testnet/mainnet, use:
    # deploy_environment="testnet",
)


def deploy_guardian_vault(
    algod_client: AlgodClient,
    indexer_client: IndexerClient,
    app_spec: ApplicationSpecification,
    deployer_account: str,
    ai_authorizer_address: str,
) -> GuardianVaultClient:
    """
    Deploy the GuardianVault smart contract.
    
    Args:
        algod_client: Algorand algod client
        indexer_client: Algorand indexer client
        app_spec: Application specification
        deployer_account: Account address deploying the contract
        ai_authorizer_address: Address authorized to update risk scores
    
    Returns:
        GuardianVaultClient instance
    """
    # Get deployer account
    deployer = get_account(deployer_account)
    
    # Create factory
    factory = GuardianVaultFactory(
        algorand_client=algod_client,
        indexer_client=indexer_client,
    )
    
    # Deploy the contract
    # The create method takes owner and ai_authorizer as parameters
    result = factory.deploy(
        create_params={
            "sender": deployer.address,
            "args": [deployer.address, ai_authorizer_address],
        },
        on_complete="NoOp",
    )
    
    client = result.app_client
    
    print(f"GuardianVault deployed successfully!")
    print(f"App ID: {client.app_id}")
    print(f"App Address: {client.app_address}")
    print(f"Owner: {deployer.address}")
    print(f"AI Authorizer: {ai_authorizer_address}")
    
    return client


def get_deployed_client(
    algod_client: AlgodClient,
    indexer_client: IndexerClient,
    app_id: int,
) -> GuardianVaultClient:
    """
    Get a client for an already deployed GuardianVault contract.
    
    Args:
        algod_client: Algorand algod client
        indexer_client: Algorand indexer client
        app_id: Application ID of the deployed contract
    
    Returns:
        GuardianVaultClient instance
    """
    client = GuardianVaultClient(
        algod_client=algod_client,
        indexer_client=indexer_client,
        app_id=app_id,
    )
    
    return client
