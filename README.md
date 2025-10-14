### Algorand dApp Quick Start Guide (Base Template)

This guide helps non‑technical founders and developers quickly prototype and test Web3 ideas on Algorand using this starter. You’ll set up the project, customize the UI via safe AI prompts, mint tokens and NFTs, and interact with smart contracts.

- Repo to fork/clone: `https://github.com/marotipatre/Hackseries-2-QuickStart-template` (source)
- Works with AlgoKit monorepo structure (contracts + React frontend)
- Includes prebuilt “cards” demonstrating key patterns:
  - Counter: simple contract interaction
  - Bank: complex interaction with contract + Indexer
  - Asset Create: mint fungible tokens (ASAs)
  - NFT Mint: upload to IPFS and mint ARC NFTs
  - Payments: send ALGO and ASA (e.g., USDC)

[Base template repo](https://github.com/marotipatre/Hackseries-2-QuickStart-template)

---

## 1) Project Setup

Prerequisites:
- Docker (running)
- Node.js 18+ and npm
- AlgoKit installed (see official docs)

Clone or fork the base template:

```bash
git clone https://github.com/marotipatre/Hackseries-2-QuickStart-template.git
cd Hackseries-2-QuickStart-template
```

Bootstrap the workspace (installs deps, sets up venv, etc.):

```bash
algokit project bootstrap all
```

Build all projects:

```bash
algokit project run build
```

Run the frontend:

```bash
cd projects/frontend
npm install
npm run dev
```

Optional: alternative starter to compare or borrow patterns from:

```bash
git clone https://github.com/Ganainmtech/Algorand-dApp-Quick-Start-Template-TypeScript.git
```

References:
- Algorand Developer Portal: `https://dev.algorand.co/`
- AlgoKit Workshops: `https://algorand.co/algokit-workshops`
- Algodevs YouTube: `https://www.youtube.com/@algodevs`

---

## 2) Required environment variables (Frontend)

Create `projects/frontend/.env` with the following values for TestNet (adjust as needed):

```bash
# Network (Algod)
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
VITE_ALGOD_PORT=
VITE_ALGOD_TOKEN=
VITE_ALGOD_NETWORK=testnet

# Indexer (for Bank/indexed reads)
VITE_INDEXER_SERVER=https://testnet-idx.algonode.cloud
VITE_INDEXER_PORT=
VITE_INDEXER_TOKEN=

# Optional: KMD (if using a local KMD wallet)
VITE_KMD_SERVER=http://localhost
VITE_KMD_PORT=4002
VITE_KMD_TOKEN=a-super-secret-token
VITE_KMD_WALLET=unencrypted-default-wallet
VITE_KMD_PASSWORD=some-password

# Pinata (NFT media + metadata to IPFS)
# Generate a JWT in Pinata and paste below
VITE_PINATA_JWT=eyJhbGciOi...  # JWT from Pinata
# Optional: custom gateway
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs
```

Notes:
- Algod/Indexer config is read by `src/utils/network/getAlgoClientConfigs.ts`:
  - `VITE_ALGOD_SERVER`, `VITE_ALGOD_PORT`, `VITE_ALGOD_TOKEN`, `VITE_ALGOD_NETWORK`
  - `VITE_INDEXER_SERVER`, `VITE_INDEXER_PORT`, `VITE_INDEXER_TOKEN`
- Pinata integration expects `VITE_PINATA_JWT` and optional `VITE_PINATA_GATEWAY` for NFT uploads (see `src/utils/pinata.ts`).
- Restart the dev server after editing `.env`.

Pinata API keys/JWT: create via Pinata dashboard `https://app.pinata.cloud/developers/api-keys` and use the generated JWT.

---

## 3) Project map (what to tweak)

Frontend location: `projects/frontend`

Key files:
- `src/Home.tsx` — Landing page
- `src/components/Transact.tsx` — Payments (ALGO, template for ASA)
- `src/components/Bank.tsx` — Contract + Indexer demo (deploy, deposit, withdraw, statements, depositors)
- `src/components/CreateASA.tsx` — Create fungible tokens (ASA)
- `src/components/MintNFT.tsx` — Mint NFTs with IPFS media/metadata
- `src/components/AppCalls.tsx` — Example app call wiring to a contract
- `src/utils/pinata.ts` — Pinata IPFS utilities (file/JSON pin)
- `src/utils/network/getAlgoClientConfigs.ts` — Network configs from Vite env

Contracts (generated artifacts, clients):
- `projects/contracts/smart_contracts/**` and `projects/frontend/src/contracts/**`

---

## 4) Use AI to redesign UI safely (keep logic intact)

How to work:
1) Open the target file and copy its full contents.
2) Paste into your AI tool (ChatGPT/Claude/Gemini).
3) Use the corresponding prompt below to redesign using TailwindCSS.
4) Replace only JSX/markup/styles. Do NOT change logic, imports, props, state, handlers, or function calls.

### 4.1 Home (Landing Page)

File: `projects/frontend/src/Home.tsx`

Prompt:
```
I'm building an Algorand dApp and want to improve the design of my landing page in projects/frontend/src/Home.tsx. Please redesign the layout using modern web design principles with TailwindCSS. Include:
- A visually striking hero section with a short headline and subheading
- A primary call-to-action button that navigates to key features
- A simple feature grid that highlights the cards: Counter, Bank, Payments, Create Token (ASA), Mint NFT
- Balanced spacing, responsive design (mobile/desktop), and a Web3/tech-style color theme
Keep ALL existing logic for wallet connection, navigation, event handlers, and button states EXACTLY as they are — do not change any logic or data flow. Only change the JSX structure and Tailwind classes.
```

### 4.2 Payments (Transact)

File: `projects/frontend/src/components/Transact.tsx`

Prompt:
```
I'm building a payments dApp on Algorand that allows users to send ALGO or USDC to others. I’ve pasted the existing projects/frontend/src/components/Transact.tsx which already contains transaction logic. Please redesign this component using TailwindCSS to look like a clean, modern payment interface:
- Clear inputs for recipient address and read-only display for amount (1 ALGO in this example)
- A prominent Send button
- Helpful labels, subtle validation states, and a simple success message area
- Responsive, minimal Web3 design aesthetic
Keep ALL wallet and transaction logic EXACTLY as it is — do not change any function names, props, state variables, or event handlers.
```

Optional extension prompt (ASA like USDC):
```
Extend the UI design to optionally switch between sending ALGO or an ASA (e.g., USDC) without changing existing ALGO logic. Only provide additional JSX blocks and Tailwind classes; do not modify or remove the current payment logic. You can add a new tab-like UI and mock disabled form fields for ASA to show the final look-and-feel.
```

### 4.3 Bank (Complex contract + Indexer)

File: `projects/frontend/src/components/Bank.tsx`

Prompt:
```
This is a "Bank" demo that shows a more complex Algorand contract integration with Indexer queries, boxes, and inner transactions. I’ve pasted projects/frontend/src/components/Bank.tsx. Please enhance the UI with TailwindCSS:
- Clear App ID input and App Address display
- Two panels: Deposit (memo + amount) and Withdraw (amount)
- A status area for loading/spinners and action feedback
- Paginated, scrollable Statements and Depositors lists, with clear labels and link to explorer
- Keep it responsive and professional with a dashboard feel
Do NOT change any logic, props, function names, or data fetching. Only adjust JSX structure and Tailwind classes.
```

### 4.4 Create ASA (Fungible tokens)

File: `projects/frontend/src/components/CreateASA.tsx`

Prompt:
```
I'm building a loyalty/stablecoin-like token on Algorand. I’ve included projects/frontend/src/components/CreateASA.tsx with working ASA creation logic. Please redesign the component using TailwindCSS to present a professional token creation form:
- Inputs: Token Name, Unit/Symbol, Decimals, Total Supply (base units)
- A clear, primary "Create Token" button with loading/disabled states
- A compact help text about each field
- Minimal dashboard style consistent with the rest of the app
Keep ALL minting and wallet logic EXACTLY as-is — change ONLY layout and Tailwind classes.
```

### 4.5 Mint NFT (IPFS + ARC NFT)

File: `projects/frontend/src/components/MintNFT.tsx`

Prompt:
```
I'm building an Algorand-based NFT dApp that allows users to mint digital collectibles. I’ve pasted projects/frontend/src/components/MintNFT.tsx which already includes upload to IPFS and NFT mint logic. Please redesign using TailwindCSS:
- Upload field for image/file with preview
- Inputs for Name and Description
- Display upload and mint progress (spinners, progress bars, small status messages)
- A primary "Mint NFT" button with clear disabled/loading states
- A link to view the NFT/metadata via the configured IPFS gateway
Keep ALL wallet, IPFS (Pinata), and minting logic EXACTLY as-is — modify only JSX and Tailwind classes.
```

---

## 5) NFT Environment (Pinata + IPFS)

- Create Pinata API Key/JWT: `https://app.pinata.cloud/developers/api-keys`
- Put JWT in `projects/frontend/.env` as `VITE_PINATA_JWT`
- Optional: set `VITE_PINATA_GATEWAY` to your preferred gateway
- Restart dev server after changing `.env`:

```bash
npm run dev
```

NFT flow uses:
- `src/utils/pinata.ts` (expects `VITE_PINATA_JWT`, optional `VITE_PINATA_GATEWAY`)
- `pinFileToIPFS` and `pinJSONToIPFS` endpoints

---

## 6) Smart Contract interaction basics

- Example TS clients are generated into `projects/frontend/src/contracts`
- Frontend demo wiring in `src/components/AppCalls.tsx`
- Use Bank/Counter cards to explore app call patterns, boxes, and Indexer usage

Learn more:
- Algorand Dev Portal: `https://dev.algorand.co/`
- AlgoKit Workshops: `https://algorand.co/algokit-workshops`
- Algodevs YouTube: `https://www.youtube.com/@algodevs`

---

## 7) Card overview and tweak ideas

- Counter
  - Purpose: Simple app call demonstration
  - Tweak: Typography, spacing, and success toast placement
  - AI tip: “Add a hero-like header; keep all state/handlers/contract calls unchanged.”

- Bank
  - Purpose: Complex contract with deposit/withdraw and Indexer reads
  - Tweak: Two-column layout, data tables with pagination, explorer links
  - AI tip: “Make statements/depositors scrollable; maintain all function names and handlers.”

- Payments (Transact)
  - Purpose: Send ALGO (and optionally mock ASA UI)
  - Tweak: Input clarity, action emphasis, subtle validation messaging
  - AI tip: “Keep existing ALGO logic identical; ASA tab as UI-only demo.”

- Create ASA
  - Purpose: Mint fungible token
  - Tweak: Professional form design, helper text for decimals/total
  - AI tip: “Do not change the `algorand.send.assetCreate` call; style form and loading states.”

- Mint NFT
  - Purpose: Upload media/metadata to IPFS, mint an ARC NFT
  - Tweak: File upload preview, progress messages, gateway links
  - AI tip: “Keep Pinata calls and NFT mint logic intact; enhance UI and progress indicators.”

---

## 8) Troubleshooting

- “Missing VITE_ALGOD_SERVER”
  - Ensure `.env` exists in `projects/frontend` and values are set
  - Restart `npm run dev`

- “Missing VITE_PINATA_JWT” or IPFS upload fails
  - Generate JWT in Pinata dashboard and add to `.env`
  - Confirm gateway works or remove custom gateway (defaults to `https://ipfs.io/ipfs`)

- Indexer queries return empty
  - Verify `VITE_INDEXER_SERVER` is a TestNet Indexer and `VITE_ALGOD_NETWORK=testnet`
  - Confirm correct App ID in Bank card

- Transactions fail
  - Ensure wallet is connected and funded
  - For Bank, input a valid App ID or deploy via the card

---

## 9) CI/CD (Optional)

- Integrate with GitHub Actions for lint/type/test and deployments.
- Deploy smart contracts via `algokit deploy`.
- Deploy frontend to Vercel/Netlify; add these `.env` variables to hosting settings.

---

## 10) Copy‑ready AI Prompt Snippets

Use these verbatim as you work card‑by‑card:

- Home:
```
Redesign projects/frontend/src/Home.tsx using TailwindCSS for a modern Web3 landing page with a strong hero, concise subtitle, and a grid of feature cards (Counter, Bank, Payments, Create Token, Mint NFT). Keep all wallet/navigation logic, props, and handlers EXACTLY as-is. Modify only JSX and Tailwind classes.
```

- Transact:
```
Redesign projects/frontend/src/components/Transact.tsx into a clean payments UI (recipient input, 1 ALGO send button, success message area). Keep ALL existing logic and handlers unchanged. Modify only JSX/Tailwind. Optionally add an ASA tab UI mock without changing logic.
```

- Bank:
```
Enhance projects/frontend/src/components/Bank.tsx with a dashboard feel: App ID input, deploy section, deposit/withdraw cards, scrollable statements and depositors lists with explorer links. Maintain ALL logic and calls as-is; only update layout and Tailwind classes.
```

- Create ASA:
```
Redesign projects/frontend/src/components/CreateASA.tsx to a professional token creation form with inputs (Name, Unit, Decimals, Total), helper text, and a prominent Create button with loading state. Keep all ASA creation logic intact; change only JSX/Tailwind.
```

- Mint NFT:
```
Redesign projects/frontend/src/components/MintNFT.tsx for a sleek NFT minter: file upload with preview, name/description fields, visible Mint button, and progress indicators. Keep Pinata, IPFS, and mint logic untouched; only adjust JSX/Tailwind.
```

---



