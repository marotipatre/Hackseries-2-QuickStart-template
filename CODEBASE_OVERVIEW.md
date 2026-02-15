# Codebase Overview

This workspace is an AlgoKit monorepo with two main projects:

- projects/contracts: Algorand smart contracts written in Algorand Python (algopy), plus build/deploy tooling and tests.
- projects/frontend: React + Vite UI that talks to the contracts via generated TypeScript clients, plus wallet integration and UI flows.

The repo is based on the AlgoKit quick start template and includes a few demo cards (Counter, Bank, Send Algo, Create ASA, Mint NFT, Asset Opt-In).

---

## Top-level layout

- README.md: root setup guidance and environment variable notes.
- projects/contracts: smart contracts, artifacts, and tests.
- projects/frontend: dApp UI, typed clients, and UI tests.

---

## Smart contracts (projects/contracts)

### Structure

- smart_contracts/__main__.py: build/deploy entrypoint. It discovers contract folders with a contract.py, compiles them with `algokit compile`, and generates ARC-56 specs and clients. It also wires deployment hooks if a deploy_config.py exists.
- smart_contracts/counter/contract.py: Counter contract with a single ABI method `incr_counter()` that increments and returns a global counter.
- smart_contracts/counter/deploy_config.py: deploys Counter via algokit-utils and funds the app address after deploy.
- smart_contracts/bank/contract.py: Bank contract with `deposit()` and `withdraw()`.
  - Uses a BoxMap to track per-account deposits.
  - Enforces receiver checks, amount validation, and ensures withdrawals do not exceed balance.
  - Uses an inner payment to send ALGO back to the caller.
- smart_contracts/bank/deploy_config.py: deploys Bank via algokit-utils.
- smart_contracts/artifacts/**: generated ARC-56 specs, TEAL, and typed clients (both Python and TypeScript). These are produced by the build step.

### Build and deploy flow

- Entry: smart_contracts/__main__.py
- Build:
  - Runs `algokit compile python` for each contract.
  - Emits ARC-56 JSON and TEAL in artifacts.
  - Generates typed clients using `algokit generate client`.
- Deploy:
  - Calls deploy functions in each contract's deploy_config.py.
  - Uses `algokit_utils.AlgorandClient` with accounts from environment variables.

### Tests

- tests/counter_test.py: unit test using algopy_testing context.
- tests/counter_client_test.py: integration tests using localnet and typed clients.
- tests/conftest.py: provides Algorand client fixture configured via env.

Note: the tests reference a `hello` ABI method on Counter, but the current Counter contract only defines `incr_counter`. This means the Counter tests are out of sync with the contract and will fail unless the contract is updated or the tests are corrected.

### Tooling

- Poetry for Python dependencies.
- Ruff, Black, mypy, pytest, pip-audit for code quality.

---

## Frontend (projects/frontend)

### Entry and app wiring

- src/main.tsx: React root with `ErrorBoundary` and `App`.
- src/App.tsx: initializes `WalletManager` with localnet KMD or browser wallets based on env; wraps app in `WalletProvider` and `SnackbarProvider`.
- src/Home.tsx: landing UI with cards that open modals for each feature.

### Feature components

- ConnectWallet: wallet modal with connect/disconnect flow and account display.
- AppCalls: connects to Counter typed client to read and increment the on-chain counter.
- SendAlgo: simple payment UI using Algokit `AlgorandClient`.
- CreateASA: mints a fungible ASA.
- MintNFT: uploads media/metadata to Pinata and mints an ARC-3 NFT (asset create with metadata hash).
- AssetOptIn: opts into an existing ASA.
- Bank: deploys Bank, makes deposits and withdrawals, and reads Indexer data for statements and depositors.

### Utilities

- utils/network/getAlgoClientConfigs.ts: reads Algod/Indexer/KMD config from Vite env vars.
- utils/pinata.ts: Pinata upload helpers and gateway URL builder.
- utils/ellipseAddress.ts: short address formatting for UI.

### Contracts in frontend

- src/contracts/**: typed TypeScript clients generated from ARC-56 specs. These are used by AppCalls and Bank.
- src/contracts/README.md: instructions for generating and linking typed clients.

### Styling and tooling

- Tailwind CSS + daisyUI.
- Vite build with node polyfills for Buffer.
- Jest and Playwright test setup.

### Frontend tests

- tests/example.spec.ts: Playwright E2E checks for title, getting-started link, wallet connect, and a payment flow.

Note: The Home UI no longer includes `data-test-id` values like `getting-started` or `transactions-demo`, so these tests appear to be out of sync with the current UI.

---

## Configuration and environment

- Contracts use AlgoKit env vars (DEPLOYER account, network selection) and can generate `.env` via `algokit generate env-file`.
- Frontend uses Vite env vars for Algod/Indexer/KMD and Pinata. See root README for required values.

---

## Should we migrate to Next.js?

Short answer: not necessary for this codebase right now.

Why:
- The app is a client-heavy dApp that depends on browser wallet providers and client-side signing. Vite + React is already a good fit.
- There is no server-side rendering or SEO requirement evident in the current feature set.
- Next.js would add complexity (routing, server/client component boundaries, SSR vs client-only wallet logic) without a clear benefit.

Migrate only if you need one or more of these:
- Strong SEO or SSR for marketing pages.
- File-based routing and nested layouts.
- Server-side APIs or server actions tied to the same app.
- Hybrid rendering for public pages plus authenticated dApp pages.

If those are product requirements, Next.js is a good choice. Otherwise, staying on Vite keeps the toolchain simpler and is fully sufficient for the current functionality.
