# PiggyBank Smart Contract Deployment Guide

This guide explains how to deploy the PiggyBank smart contract to Algorand Testnet.

## Prerequisites

1. **AlgoKit CLI** installed ([Installation Guide](https://developer.algorand.org/docs/get-started/algokit/))
2. **Python 3.12+** with Poetry installed
3. **Testnet ALGO** for deployment (get from [Testnet Dispenser](https://bank.testnet.algorand.network/))

## Project Structure

```
contracts/
├── smart_contracts/
│   ├── piggybank/
│   │   ├── __init__.py
│   │   ├── contract.py      # Main PiggyBank contract
│   │   └── deploy_config.py # Deployment configuration
│   └── artifacts/
│       └── piggybank/       # Generated after build
│           ├── PiggyBank.approval.teal
│           ├── PiggyBank.clear.teal
│           ├── PiggyBank.arc56.json
│           └── piggybank_client.py
```

## Step 1: Environment Setup

### 1.1 Create/Update Environment File

Create a `.env.testnet` file in the `contracts` directory:

```bash
# Algorand Testnet Configuration
ALGOD_SERVER=https://testnet-api.algonode.cloud
ALGOD_PORT=443
ALGOD_TOKEN=

INDEXER_SERVER=https://testnet-idx.algonode.cloud
INDEXER_PORT=443
INDEXER_TOKEN=

# Deployer Account (NEVER commit real mnemonics!)
DEPLOYER_MNEMONIC=your_25_word_mnemonic_here
```

### 1.2 Install Dependencies

```bash
cd projects/contracts
poetry install
```

## Step 2: Build the Contract

### 2.1 Compile the Smart Contract

```bash
# From contracts directory
poetry run python -m smart_contracts build
```

Or using AlgoKit:

```bash
algokit project run build
```

This generates:
- TEAL approval/clear programs
- ARC-56 contract specification
- Python typed client

### 2.2 Verify Build Output

Check that files were created in `smart_contracts/artifacts/piggybank/`:

```bash
ls smart_contracts/artifacts/piggybank/
# Expected: PiggyBank.approval.teal, PiggyBank.clear.teal, PiggyBank.arc56.json, piggybank_client.py
```

## Step 3: Deploy to Testnet

### 3.1 Fund Your Deployer Account

1. Get your deployer address:
   ```bash
   # Your address is derived from DEPLOYER_MNEMONIC
   ```

2. Fund it from [Testnet Dispenser](https://bank.testnet.algorand.network/)
   - Request at least 10 ALGO for contract deployment and transactions

### 3.2 Deploy the Contract

```bash
# Deploy using AlgoKit
algokit project deploy testnet
```

Or manually:

```bash
poetry run python -m smart_contracts deploy --network testnet
```

### 3.3 Record the App ID

After deployment, you'll see output like:
```
Deployed PiggyBank app 123456789 to address ABCD...XYZ
```

**Save this App ID** - you'll need it for frontend integration.

## Step 4: Initialize a PiggyBank Project

### 4.1 Using Python Script

Create a script `initialize_project.py`:

```python
import algokit_utils
from smart_contracts.artifacts.piggybank.piggybank_client import PiggyBankClient
from algosdk.v2client import algod

# Setup client
algorand = algokit_utils.AlgorandClient.testnet()
account = algorand.account.from_mnemonic("your mnemonic here")

# Get app client
app_client = algorand.client.get_typed_app_client(
    PiggyBankClient,
    app_id=YOUR_APP_ID,  # Replace with your deployed App ID
    default_sender=account.address,
    default_signer=account.signer,
)

# Initialize project with token
result = app_client.send.initialize_project(
    args={
        "name": "My PiggyBank",
        "description": "A community savings project",
        "token_name": "PiggyToken",
        "token_symbol": "PIGGY",
        "token_supply": 1_000_000_000_000,  # 1M tokens with 6 decimals
        "goal": 100_000_000,  # 100 ALGO goal
        "mbr_pay": algokit_utils.PayParams(
            receiver=app_client.app_address,
            amount=200_000,  # 0.2 ALGO for ASA creation
        ),
    }
)

print(f"Token created with ID: {result.return_value}")
```

## Step 5: Frontend Integration

### 5.1 Generate TypeScript Client

The TypeScript client is auto-generated. Copy it to frontend:

```bash
# From project root
cp projects/contracts/smart_contracts/artifacts/piggybank/piggybank_client.py \
   projects/frontend/src/contracts/
```

For TypeScript, use AlgoKit to generate:

```bash
algokit generate client \
  projects/contracts/smart_contracts/artifacts/piggybank/PiggyBank.arc56.json \
  --output projects/frontend/src/contracts/PiggyBank.ts \
  --language typescript
```

### 5.2 Update Frontend .env

Add App ID to `frontend/.env`:

```bash
VITE_PIGGYBANK_APP_ID=123456789
```

## Step 6: Tinyman Integration (Testnet)

### 6.1 Tinyman Testnet Info

- **Testnet App ID**: 62368684
- **Testnet Validator App ID**: 62368684
- **Testnet AMM Contract**: ASA pools auto-created

### 6.2 Create Liquidity Pool

After creating your project token, bootstrap a Tinyman pool:

```typescript
// See frontend/src/components/PiggyBank.tsx for full implementation
import { TinymanV2TestnetClient } from '@tinyman/sdk'

// The token created by PiggyBank can be paired with ALGO
// to create a trading pool on Tinyman
```

### 6.3 Trading URL

Direct users to trade on Tinyman:
```
https://testnet.tinyman.org/#/swap?asset_in=0&asset_out=YOUR_TOKEN_ID
```

## Contract Methods

| Method | Description |
|--------|-------------|
| `initialize_project` | Create a new project with token |
| `deposit` | Deposit ALGO to the piggybank |
| `withdraw` | Withdraw ALGO from deposits |
| `claim_tokens` | Claim project tokens based on deposits |
| `get_project_info` | Get project details (readonly) |
| `get_deposit` | Get user's deposit amount (readonly) |
| `is_goal_reached` | Check if goal is met (readonly) |

## Troubleshooting

### "Insufficient funds"
- Fund deployer account with more ALGO
- Ensure MBR payments are included

### "Project already initialized"
- Each contract instance can only have one project
- Deploy a new contract for a new project

### "Transaction rejected"
- Check that signer matches sender
- Verify App ID is correct
- Ensure contract is opted-in to required assets

## Testnet Resources

- **Algorand Testnet Dispenser**: https://bank.testnet.algorand.network/
- **Testnet Block Explorer**: https://testnet.algoexplorer.io/
- **Tinyman Testnet**: https://testnet.tinyman.org/
- **AlgoKit Docs**: https://developer.algorand.org/docs/get-started/algokit/

## Production Deployment

For Mainnet deployment:
1. Update `.env.mainnet` with mainnet nodes
2. Fund deployer with real ALGO
3. Run: `algokit project deploy mainnet`
4. Update Tinyman to Mainnet endpoints

⚠️ **Important**: Always test thoroughly on Testnet before Mainnet deployment!
