# Supabase Database Setup

This document explains how to set up the Supabase database for user profiles in PiggyBag.

## Prerequisites

1. Create a free Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project in Supabase

## Environment Variables

Add the following to your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase project dashboard under **Settings > API**.

## Database Schema

### Create the `user_profiles` Table

Run the following SQL in the Supabase SQL Editor (**Database > SQL Editor**):

```sql
-- Create the user_profiles table
CREATE TABLE public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  twitter_url TEXT NOT NULL DEFAULT '',
  linkedin_url TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- If table already exists, add avatar_url for existing projects
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT '';

-- Create an index on wallet_address for faster lookups
CREATE INDEX idx_user_profiles_wallet_address ON public.user_profiles(wallet_address);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read any profile (public profiles)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.user_profiles
  FOR SELECT
  USING (true);

-- Policy: Anyone can insert their own profile (using wallet address)
CREATE POLICY "Anyone can create a profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can update their own profile (using wallet address)
-- Note: In production, you may want to implement wallet signature verification
CREATE POLICY "Anyone can update a profile"
  ON public.user_profiles
  FOR UPDATE
  USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to call the function on update
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Table Structure

| Column         | Type                     | Description                           |
|----------------|--------------------------|---------------------------------------|
| id             | UUID                     | Primary key, auto-generated           |
| wallet_address | TEXT                     | Algorand wallet address (unique)      |
| name           | TEXT                     | User's display name                   |
| description    | TEXT                     | User's bio/description                |
| twitter_url    | TEXT                     | URL to user's Twitter/X profile       |
| linkedin_url   | TEXT                     | URL to user's LinkedIn profile        |
| avatar_url     | TEXT                     | Path to selected avatar image         |
| created_at     | TIMESTAMP WITH TIME ZONE | When the profile was created          |
| updated_at     | TIMESTAMP WITH TIME ZONE | When the profile was last updated     |

## Security Considerations

### Current Implementation (Development)
The current Row Level Security (RLS) policies allow anyone to create and update profiles. This is suitable for development and testing.

### Production Recommendations
For production, consider implementing:

1. **Wallet Signature Verification**: Require users to sign a message with their wallet to prove ownership before allowing profile updates.

2. **Server-side Verification**: Use Supabase Edge Functions to verify wallet signatures server-side.

3. **Stricter RLS Policies**: Update RLS policies to verify wallet ownership:

```sql
-- Example: More restrictive update policy (requires custom auth)
CREATE POLICY "Users can only update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (wallet_address = current_setting('app.current_wallet_address', true));
```

## API Reference

The Supabase client is configured in `src/utils/supabase.ts` and provides the following functions:

### `getUserProfile(walletAddress: string)`
Fetches a user profile by wallet address.

### `upsertUserProfile(profile: UserProfile)`
Creates or updates a user profile. Uses the wallet_address as the unique identifier.

### `checkUserExists(walletAddress: string)`
Checks if a user profile exists for the given wallet address.

## Troubleshooting

### "relation 'user_profiles' does not exist"
Run the SQL schema creation script in the Supabase SQL Editor.

### "new row violates row-level security policy"
Ensure RLS policies are correctly configured using the SQL script above.

### "Supabase URL or Anon Key is missing"
Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in your `.env` file.
