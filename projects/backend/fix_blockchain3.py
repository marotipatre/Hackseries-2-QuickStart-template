#!/usr/bin/env python3
"""Fix blockchain_service.py - get_algod_client API changes"""

# Read the file
with open('app/services/blockchain_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix _get_algod_client method
old_algod = '''def _get_algod_client(self) -> AlgodClient:
        """Get the Algorand algod client."""
        return get_algod_client(
            server=settings.ALGORAND_NODE_URL or "https://testnet-api.algonode.cloud",
            port=443,
            token="",
        )'''

new_algod = '''def _get_algod_client(self) -> AlgodClient:
        """Get the Algorand algod client."""
        return get_algod_client(
            settings.ALGORAND_NODE_URL or "https://testnet-api.algonode.cloud"
        )'''

content = content.replace(old_algod, new_algod)

# Fix _get_indexer_client method
old_indexer = '''def _get_indexer_client(self) -> IndexerClient:
        """Get the Algorand indexer client."""
        return get_indexer_client(
            server=settings.ALGORAND_INDEXER_URL or "https://testnet-idx.algonode.cloud",
            port=443,
            token="",
        )'''

new_indexer = '''def _get_indexer_client(self) -> IndexerClient:
        """Get the Algorand indexer client."""
        return get_indexer_client(
            settings.ALGORAND_INDEXER_URL or "https://testnet-idx.algonode.cloud"
        )'''

content = content.replace(old_indexer, new_indexer)

# Write back
with open('app/services/blockchain_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed blockchain_service.py - updated get_algod_client and get_indexer_client API")
