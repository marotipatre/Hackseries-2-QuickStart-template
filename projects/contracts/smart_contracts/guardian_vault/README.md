# GuardianVault Smart Contract

AI-Powered DeFi Risk & Compliance Assistant on Algorand

## Overview

GuardianVault is a smart contract that provides AI-powered risk management for DeFi transactions. It combines off-chain AI intelligence with on-chain enforcement to protect users from risky or fraudulent financial actions.

## Key Features

- **Risk Score Storage**: Stores user-specific risk scores (0-100) on-chain
- **AI Authorization**: Only authorized AI addresses can update risk scores
- **Transaction Enforcement**: Blocks transactions that exceed user-defined risk thresholds
- **Emergency Freeze**: Owner or AI can freeze vaults in emergencies
- **Immutable Audit Log**: All decisions are logged on-chain for transparency
- **User Control**: Users can set their own risk thresholds

## Contract Methods

### Initialization

| Method | Description | Access |
|--------|-------------|--------|
| `create(owner, ai_authorizer)` | Initialize contract with owner and AI addresses | Anyone (on creation) |

### Vault Management

| Method | Description | Access |
|--------|-------------|--------|
| `create_vault(risk_threshold)` | Create a new vault with personal risk threshold | Any user |
| `update_threshold(new_threshold)` | Update personal risk threshold | Vault owner |
| `get_vault_status(user)` | Get vault status (threshold, score, frozen) | Anyone |

### Risk Management

| Method | Description | Access |
|--------|-------------|--------|
| `update_risk_score(user, score)` | Update user's risk score | AI Authorizer only |
| `check_and_execute(action_type)` | Check risk and allow/block transaction | Vault owner |

### Emergency Controls

| Method | Description | Access |
|--------|-------------|--------|
| `freeze_vault(user)` | Freeze a vault (block all transactions) | Owner or AI |
| `unfreeze_vault(user)` | Unfreeze a vault | Owner only |

### Audit & Admin

| Method | Description | Access |
|--------|-------------|--------|
| `get_audit_entry(index)` | Get specific audit log entry | Anyone |
| `get_audit_count()` | Get total audit entries | Anyone |
| `update_ai_authorizer(new_address)` | Update AI authorizer address | Owner only |

## Storage Schema

### Global State

| Key | Type | Description |
|-----|------|-------------|
| `owner` | Address | Contract owner with admin privileges |
| `ai_authorizer` | Address | Authorized AI service address |
| `audit_counter` | UInt64 | Counter for audit log entries |

### BoxMap Storage

| BoxMap | Key | Value | Description |
|--------|-----|-------|-------------|
| `vaults` | Address | UInt64 | User -> Risk Threshold |
| `risk_scores` | Address | UInt64 | User -> Current Risk Score |
| `is_frozen` | Address | Bool | User -> Frozen Status |
| `audit_log` | UInt64 | (Address, UInt64, UInt64, UInt64) | Audit entries |

## Decision Codes

| Code | Meaning |
|------|---------|
| 0 | BLOCKED - Transaction blocked due to high risk |
| 1 | ALLOWED - Transaction allowed |
| 2 | FROZEN - Vault frozen |

## Deployment

### LocalNet

```bash
# Start localnet
algokit localnet start

# Build contract
algokit project run build -- guardian_vault

# Deploy contract
algokit project deploy localnet -- guardian_vault
```

### TestNet

```bash
# Build contract
algokit project run build -- guardian_vault

# Deploy contract
algokit project deploy testnet -- guardian_vault
```

## Usage Example

```python
from smart_contracts.artifacts.guardian_vault.client import GuardianVaultClient

# Get client
client = GuardianVaultClient(
    algod_client=algod_client,
    indexer_client=indexer_client,
    app_id=app_id,
)

# Create vault with risk threshold of 70
result = client.send.create_vault(
    args=[70],
    sender=user_address,
)

# AI updates risk score
client.send.update_risk_score(
    args=[user_address, 85],
    sender=ai_authorizer_address,
)

# Check if transaction is allowed
allowed = client.send.check_and_execute(
    args=["transfer"],
    sender=user_address,
)

# Get vault status
threshold, score, frozen = client.send.get_vault_status(
    args=[user_address],
)
```

## Security Considerations

1. **AI Authorization**: Only the authorized AI address can update risk scores
2. **Owner Controls**: Contract owner has freeze/unfreeze privileges
3. **User Sovereignty**: Users control their own risk thresholds
4. **Immutable Audit**: All decisions are permanently logged on-chain
5. **No Asset Access**: The contract never holds or controls user assets

## License

MIT
