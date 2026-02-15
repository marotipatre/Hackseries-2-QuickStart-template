# PiggyBag

PiggyBag is a student-focused fundraising platform built on Algorand. Creators launch fundraising projects, receive on-chain contributions, and issue project tokens with transparent, verifiable activity.

## Live Application

- Production URL: https://piggybag.vercel.app

## Repository Structure

This repository is organized as an AlgoKit-style monorepo under `projects/`:

- `projects/contracts` — Smart contracts, deployment logic, and contract tests
- `projects/frontend` — React + TypeScript web application

## Core Capabilities

- Wallet connection for Algorand accounts (local and network wallets)
- On-chain project creation and contribution flow
- Token-related workflows for project ecosystems
- Smart contract examples for counter, bank, and piggy bank patterns
- Supabase integration for off-chain project metadata and feeds

## Technology Stack

- Algorand, AlgoKit, Algorand Python
- React, TypeScript, Vite, Tailwind CSS
- use-wallet (wallet integration)
- Supabase (project data and feed)
- Poetry + Pytest (contracts development and testing)

## Prerequisites

Install the following before running the project locally:

- Node.js 20+
- npm or pnpm
- Python 3.12+
- Poetry
- AlgoKit CLI v2+
- Docker (required for local Algorand LocalNet workflows)

## Local Development

### 1) Bootstrap dependencies

From the `projects` directory:

```bash
algokit project bootstrap all
```

### 2) Run frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

### 3) Build frontend

```bash
cd frontend
pnpm run build
```

## Smart Contracts Workflow

From `projects/contracts`:

```bash
poetry run python -m smart_contracts build
poetry run pytest
```

Optional deployment commands:

```bash
algokit project deploy localnet
algokit project deploy testnet
```

See deployment documentation:

- `projects/contracts/DEPLOYMENT_GUIDE.md`
- `projects/contracts/PIGGYBANK_DEPLOYMENT.md`

## Environment Configuration

Frontend environment variables are stored in:

- `projects/frontend/.env`
- `projects/frontend/.env.template` (reference)

For Supabase setup, see:

- `projects/frontend/SUPABASE_SETUP.md`

## Testing and Quality Checks

Frontend (`projects/frontend`):

```bash
pnpm run lint
pnpm run test
pnpm run playwright:test
```

Contracts (`projects/contracts`):

```bash
poetry run pytest
poetry run ruff check .
poetry run black --check --diff .
poetry run mypy
```

## Additional Documentation

- `CODEBASE_OVERVIEW.md`
- `Alokit_setup.md`
- `projects/frontend/README.md`
- `projects/contracts/README.md`

## License

No license file is currently defined in this repository.


