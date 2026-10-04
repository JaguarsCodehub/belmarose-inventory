# Supabase Database Setup Guide for Belmarose Stock & Inventory

## How to Apply Migrations to Supabase

### Option 1: Via Supabase Web Dashboard (Easiest & Fastest)
1. Go to your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Click on the **SQL Editor** in the left navigation sidebar.
3. Click **New Query**.
4. Copy the entire contents of `supabase/migrations/20261002000000_init_schema.sql` and paste it into the editor.
5. Click **Run** (or `Ctrl+Enter`).
6. Click **New Query** again.
7. Copy the contents of `supabase/migrations/20261002000001_seed_belmarose_data.sql` (contains all 20 Belmarose products, categories, vendors, sample orders, and discrepancies).
8. Click **Run**.
9. In **Project Settings** -> **API**, copy your `Project URL` and `anon public` key, and paste them into `.env`.

### Option 2: Via Supabase CLI (Developer Workflow)
```bash
# Login to Supabase CLI
supabase login

# Link your local repo to your Supabase project
supabase link --project-ref your-project-ref

# Push the migrations
supabase db push
```

### Mock / Offline Fallback Mode
If `.env` has placeholder credentials, the application is designed to gracefully switch to a high-fidelity local state store loaded with the Belmarose seed data! You can test, create orders, log daily stock counts, record wastage, track discrepancies, and generate supplier PDF order sheets immediately without waiting for Supabase to be connected. Once you provide Supabase credentials, it seamlessly routes all actions directly to Supabase PostgreSQL!
