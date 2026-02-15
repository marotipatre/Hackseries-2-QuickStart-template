# Supabase Snippets for PiggyBank

This folder contains all the Supabase-related code snippets for the PiggyBank feature.

## Files

### `supabase_schema.sql`
SQL schema to create the required tables in Supabase:
- `piggybank_projects` - Stores project metadata
- `piggybank_deposits` - Records all deposits
- `piggybank_withdrawals` - Records all withdrawals
- `piggybank_token_claims` - Records token claims

### `piggybank_supabase.ts`
TypeScript helper functions to interact with Supabase:
- Project CRUD operations
- Deposit/Withdrawal recording
- Token claim tracking
- Search and trending queries

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase_schema.sql`
4. Run the SQL to create tables
5. Copy `piggybank_supabase.ts` to your `src/utils/` folder
6. Import and use the functions in your components

## Environment Variables

Make sure these are set in your `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Usage Example

```typescript
import { 
  createPiggyBankProject, 
  recordDeposit, 
  getAllProjects 
} from '../utils/piggybank_supabase'

// Create a new project
const { data, error } = await createPiggyBankProject({
  app_id: 12345,
  app_address: 'ALGO_APP_ADDRESS...',
  name: 'My PiggyBank',
  description: 'A savings project',
  goal_amount: 10000000, // 10 ALGO in microAlgos
  creator_address: 'WALLET_ADDRESS...',
  token_name: 'MyToken',
  token_symbol: 'MTK',
  token_total_supply: 1000000,
})

// Record a deposit
await recordDeposit({
  project_id: data.id,
  app_id: 12345,
  depositor_address: 'USER_WALLET...',
  amount: 1000000,
  txn_id: 'TXN_ID...',
})

// Get all projects
const { data: projects } = await getAllProjects()
```
