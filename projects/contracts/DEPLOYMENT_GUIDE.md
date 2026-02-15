# Algorand Smart Contract Deployment Guide

## Do You Need Private Keys?

**Yes — but you provide them as a 25-word mnemonic phrase, not a raw private key.**

When you run `algokit project deploy testnet`, the deploy script expects two environment secrets (defined in `.algokit.toml`):

| Secret               | Purpose                                                                 | Required?          |
|----------------------|-------------------------------------------------------------------------|--------------------|
| `DEPLOYER_MNEMONIC`  | 25-word mnemonic of the account that will deploy (and own) the contract | **Yes**            |
| `DISPENSER_MNEMONIC` | 25-word mnemonic of a funding account (to auto-fund the deployer)       | Optional           |

The mnemonic **is** the private key in human-readable form. Algorand derives the Ed25519 keypair from it.

---

## How Deployment Works (Step by Step)

### 1. AlgoKit reads `.algokit.toml`

```toml
[project.deploy]
command = "poetry run python -m smart_contracts deploy"
environment_secrets = [
  "DEPLOYER_MNEMONIC",
  "DISPENSER_MNEMONIC",
]
```

When you target a non-local network (e.g. `testnet`), AlgoKit treats these as **secrets** and prompts you interactively if they aren't already set in environment variables or a `.env` file.

### 2. The deploy script runs

`smart_contracts/__main__.py` is invoked with `deploy` as the action. It:
1. Loads environment variables via `dotenv`
2. Discovers all contract folders (e.g. `bank/`, `piggybank/`, `counter/`)
3. Calls each contract's `deploy_config.py → deploy()` function

### 3. Inside `deploy()`

Each contract's deploy function (e.g. `bank/deploy_config.py`):

```python
algorand = algokit_utils.AlgorandClient.from_environment()
deployer_ = algorand.account.from_environment("DEPLOYER")
```

- `AlgorandClient.from_environment()` reads `ALGOD_SERVER`, `ALGOD_TOKEN`, etc. from environment
- `from_environment("DEPLOYER")` looks for `DEPLOYER_MNEMONIC` in environment variables, creates a signing account from it

Then it uses a typed factory to deploy:

```python
factory = algorand.client.get_typed_app_factory(BankFactory, default_sender=deployer_.address)
app_client, result = factory.deploy(...)
```

### 4. What happens on-chain

- If the app doesn't exist → **Create** application transaction
- If the app exists but code changed → **Update** application transaction (configured via `OnUpdate.AppendApp`)
- The deployer account pays the transaction fee (~0.001 ALGO) and the minimum balance requirement

---

## How to Set Up for Testnet Deployment

### Option A: Environment Variable (Recommended for Hackathons)

Create a `.env.testnet` file in the `contracts/` directory:

```env
# Algorand Testnet (uses free Algonode endpoints)
ALGOD_SERVER=https://testnet-api.algonode.cloud
ALGOD_TOKEN=
ALGOD_PORT=
INDEXER_SERVER=https://testnet-idx.algonode.cloud
INDEXER_TOKEN=
INDEXER_PORT=

# ⚠️ NEVER commit this file to git!
DEPLOYER_MNEMONIC=word1 word2 word3 ... word25
```

Then run:
```bash
algokit project deploy testnet
```

### Option B: Inline Prompt

Just run the deploy command — AlgoKit will prompt you to paste the mnemonic:

```
DEPLOYER_MNEMONIC: <paste your 25 words here>
```

### Option C: GitHub Actions (CI/CD)

Store `DEPLOYER_MNEMONIC` as a GitHub Environment secret. The workflow at `.github/workflows/onchain-counter-contracts-cd.yaml` already references it.

---

## How to Get a Testnet Account

1. **Generate a new account:**
   ```bash
   algokit goal account new
   ```
   This prints an Algorand address and stores the key locally.

   Or use Python:
   ```python
   from algosdk import account, mnemonic
   private_key, address = account.generate_account()
   print("Address:", address)
   print("Mnemonic:", mnemonic.from_private_key(private_key))
   ```

2. **Fund it with Testnet ALGO:**
   - Go to the [Algorand Testnet Dispenser](https://bank.testnet.algorand.network/)
   - Paste your address and request funds (you get 10 ALGO per request)
   - You need ~1-2 ALGO to deploy a contract

---

## Security Notes

| Rule | Why |
|------|-----|
| **Never commit mnemonics to git** | Anyone with the mnemonic controls the account |
| Add `.env.testnet` to `.gitignore` | Prevents accidental exposure |
| Use a **dedicated deployer account** | Don't use your main wallet |
| Testnet ALGO has no real value | Safe to experiment with |

The frontend (wallet-connected) side does **not** need mnemonics — users sign transactions with Pera Wallet / Defly / etc. Mnemonics are only needed for the **server-side deploy script**.

---

## Can I Trade on Tinyman Testnet?

**Yes!** Tinyman V2 is available on Algorand Testnet.

### What You Can Do

| Action | How |
|--------|-----|
| **Swap tokens** | Go to [testnet.tinyman.org](https://testnet.tinyman.org) |
| **Create a pool** | Pair your ASA token with ALGO or another ASA |
| **Add/remove liquidity** | Provide tokens to earn trading fees |
| **Test integrations** | Use the Tinyman SDK or the helper utilities in `frontend/src/utils/tinyman.ts` |

### Testnet Tinyman Details

- **App ID:** `62368684`
- **URL:** https://testnet.tinyman.org
- **Analytics API:** https://testnet.analytics.tinyman.org

### How to Trade on Tinyman Testnet

1. **Get testnet ALGO** from the [dispenser](https://bank.testnet.algorand.network/)
2. **Create/mint your ASA** (use the CreateASA or MintNFT component in the frontend)
3. **Connect your wallet** to [testnet.tinyman.org](https://testnet.tinyman.org) (make sure wallet is set to Testnet)
4. **Create a pool** — pair your token with ALGO and provide initial liquidity
5. **Swap** — you (or anyone) can now swap between your token and ALGO

### Using the Project's Tinyman Utilities

The project already has Tinyman integration utilities at `frontend/src/utils/tinyman.ts`:

```typescript
import { getTinymanSwapUrl, getTinymanPoolCreateUrl } from './utils/tinyman'

// Get swap URL for your token
const swapUrl = getTinymanSwapUrl(0, YOUR_ASA_ID) // 0 = ALGO

// Get pool creation URL
const poolUrl = getTinymanPoolCreateUrl(0, YOUR_ASA_ID)
```

### Limitations on Testnet Tinyman

- Tokens have **no real value** — it's a sandbox
- Liquidity is thin — price impact will be high unless you seed the pool well
- The UI and contracts work identically to mainnet — great for testing
- You need testnet ALGO to pay transaction fees (~0.001 ALGO per tx)

---

## Quick Reference: Deploy Commands

```bash
# Build all contracts
algokit project run build

# Deploy to LocalNet (no mnemonic needed — uses KMD)
algokit project deploy localnet

# Deploy to TestNet (requires DEPLOYER_MNEMONIC)
algokit project deploy testnet

# Run tests
algokit project run test
```
