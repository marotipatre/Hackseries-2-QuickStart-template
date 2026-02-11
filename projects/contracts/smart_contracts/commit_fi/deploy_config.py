from algokit import ContractDeployer

from .contract import CommitFi


def deploy() -> ContractDeployer[CommitFi]:
    """Deploy the Commit-Fi smart contract"""
    deployer = ContractDeployer(CommitFi)
    deployer.deploy()
    return deployer
