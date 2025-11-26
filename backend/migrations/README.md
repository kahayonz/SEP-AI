# Database Migrations

This folder contains SQL migration files for the SEP-AI database schema.

## Running Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of the migration file (e.g., `001_add_submission_columns.sql`)
4. Paste it into the SQL Editor
5. Click **Run** to execute the migration

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

## Migration Files

### 001_add_submission_columns.sql

Adds the following columns to the `submissions` table:
- `adjusted_ai_score` (NUMERIC): Professor-adjusted AI score (0-24)
- `human_evaluation` (TEXT): JSON string containing human evaluation scores

**Required for:** Human evaluation feature and AI score adjustment functionality

## Important Notes

- Always backup your database before running migrations
- Run migrations in order (001, 002, etc.)
- The migration files use `DO $$` blocks to check if columns exist before adding them, making them safe to run multiple times

