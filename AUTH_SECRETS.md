# Authentication Secrets Setup Guide

## Overview

This document provides complete instructions for configuring GitHub Secrets to securely manage Supabase authentication credentials and other environment variables for the Hackfluency Strategy Dashboard.

## ⚠️ Security Notice

**CRITICAL**: Never commit credentials to the repository. The previous hardcoded credentials have been removed and replaced with environment variable references.

## Required GitHub Secrets

The following secrets **must** be configured in your GitHub repository for the application to function:

| Secret Name | Required | Description | Example Value |
|-------------|----------|-------------|---------------|
| `PUBLIC_SUPABASE_URL` | ✅ Yes | Your Supabase project URL | `https://yfofmawbvlontugygfcj.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase public anon key | `sb_publishable_EFI12D4AaO2Y7o5gyWrB-g_i--T5Arz` |
| `PUBLIC_MODE` | ⚠️ Recommended | Build mode (public/dev) | `public` |
| `PUBLIC_SITE_URL` | ❌ Optional | Production site URL | `https://www.hackfluency.com` |

## Step-by-Step Setup Instructions

### Step 1: Access GitHub Secrets

1. Navigate to your repository: `https://github.com/yourusername/special-palm-tree`
2. Click **Settings** (tab at the top)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click the **New repository secret** button

### Step 2: Add Supabase URL

1. **Name**: `PUBLIC_SUPABASE_URL`
2. **Value**: Your Supabase project URL
   - Found in Supabase Dashboard → Project Settings → API → Project URL
   - Format: `https://<project-ref>.supabase.co`
3. Click **Add secret**

### Step 3: Add Supabase Anon Key

1. **Name**: `PUBLIC_SUPABASE_ANON_KEY`
2. **Value**: Your Supabase anon/public key
   - Found in Supabase Dashboard → Project Settings → API → Project API keys → `anon` (public)
   - Starts with `eyJ...` (JWT) or `sb_publishable_`
3. Click **Add secret**

### Step 4: Add Build Mode (Recommended)

1. **Name**: `PUBLIC_MODE`
2. **Value**: Choose one:
   - `public` - For production (hides builder, shows "Business only" badges)
   - `dev` - For development (full builder access)
3. Click **Add secret**

### Step 5: Add Site URL (Optional)

1. **Name**: `PUBLIC_SITE_URL`
2. **Value**: Your production domain
   - Example: `https://www.hackfluency.com`
3. Click **Add secret**

## Finding Your Supabase Credentials

### Where to Find Project URL and Anon Key

1. Log into [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Project Settings** (gear icon in left sidebar)
4. Click **API** in the submenu
5. You'll see:
   - **Project URL**: Copy this for `PUBLIC_SUPABASE_URL`
   - **Project API keys**: Copy the `anon` key for `PUBLIC_SUPABASE_ANON_KEY`

```
Supabase Dashboard → Project Settings → API

Project URL:
https://yfofmawbvlontugygfcj.supabase.co  ← PUBLIC_SUPABASE_URL

Project API keys:
├── anon (public): sb_publishable_...       ← PUBLIC_SUPABASE_ANON_KEY ✅ USE THIS
└── service_role (secret): eyJ...           ← NEVER USE THIS IN CLIENT CODE ❌
```

## Security Best Practices

### ✅ DO: Use the Anon Key

- The **anon key** is safe to use in client-side code
- It respects Row Level Security (RLS) policies
- Limited to anonymous user permissions
- This is what `PUBLIC_SUPABASE_ANON_KEY` should contain

### ❌ DON'T: Use the Service Role Key

- The **service_role key** bypasses ALL RLS policies
- It has full admin access to your database
- **NEVER** expose this in client-side code
- Only use server-side in secure environments
- If accidentally exposed, rotate immediately in Supabase Dashboard

### RLS Policy Recommendations

Ensure these RLS policies are enabled on your Supabase tables:

```sql
-- dashboard_access table
CREATE POLICY "Users can only see their own access" ON dashboard_access
  FOR SELECT USING (auth.uid() = user_id);

-- dashboards table  
CREATE POLICY "Users can only see authorized dashboards" ON dashboards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dashboard_access 
      WHERE dashboard_id = id AND user_id = auth.uid()
    )
  );
```

## Local Development Setup

For local development, create a `.env` file in `eccentric-equator/`:

```bash
cd eccentric-equator
cp .env.example .env
```

Edit `.env` with your values:

```env
PUBLIC_SUPABASE_URL=https://yfofmawbvlontugygfcj.supabase.co
PUBLIC_SUPABASE_ANON_KEY=sb_publishable_EFI12D4AaO2Y7o5gyWrB-g_i--T5Arz
PUBLIC_MODE=dev
PUBLIC_SITE_URL=http://localhost:4321
```

**Note**: `.env` is already in `.gitignore` and won't be committed.

## Troubleshooting

### Build Fails with "Missing Supabase environment variables"

**Cause**: GitHub Secrets not configured or names don't match.

**Solution**:
1. Verify secrets are added in GitHub Settings → Secrets → Actions
2. Check secret names match exactly (case-sensitive):
   - `PUBLIC_SUPABASE_URL` ✅
   - `public_supabase_url` ❌ (wrong case)
   - `SUPABASE_URL` ❌ (missing PUBLIC_ prefix)

### Authentication Not Working in Production

**Cause**: Wrong key type used.

**Solution**:
1. Verify you're using the **anon** key, not service_role
2. Check RLS policies are enabled on your tables
3. Confirm user has proper permissions in `dashboard_access` table

### "Invalid API key" Error

**Cause**: Key format is wrong or key was rotated.

**Solution**:
1. Copy the key again from Supabase Dashboard
2. Ensure no extra spaces or characters
3. If key was rotated, update the GitHub Secret with the new key

## Verifying Your Setup

After adding secrets, verify by checking a build:

1. Go to **Actions** tab in your repository
2. Click on the latest workflow run
3. Expand the "Build with Astro" step
4. Look for any environment variable errors

You can also add this debug step temporarily to your workflow:

```yaml
- name: Verify Secrets (Debug)
  run: |
    echo "Checking if secrets are set..."
    if [ -n "$PUBLIC_SUPABASE_URL" ]; then echo "✅ PUBLIC_SUPABASE_URL is set"; else echo "❌ PUBLIC_SUPABASE_URL is missing"; fi
    if [ -n "$PUBLIC_SUPABASE_ANON_KEY" ]; then echo "✅ PUBLIC_SUPABASE_ANON_KEY is set"; else echo "❌ PUBLIC_SUPABASE_ANON_KEY is missing"; fi
  env:
    PUBLIC_SUPABASE_URL: ${{ secrets.PUBLIC_SUPABASE_URL }}
    PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.PUBLIC_SUPABASE_ANON_KEY }}
```

## Migration from Hardcoded Credentials

If you're migrating from the previous hardcoded setup:

| Old Value (REMOVED) | New GitHub Secret |
|--------------------|-------------------|
| `https://yfofmawbvlontugygfcj.supabase.co` | `PUBLIC_SUPABASE_URL` |
| `sb_publishable_EFI12D4AaO2Y7o5gyWrB-g_i--T5Arz` | `PUBLIC_SUPABASE_ANON_KEY` |

## Files Modified

The following files were updated to use environment variables:

1. **`eccentric-equator/src/lib/supabase.ts`** - Now reads from `import.meta.env`
2. **`eccentric-equator/.env.example`** - Template with documentation
3. **`.github/workflows/deploy.yml`** - Injects secrets during build
4. **`.gitignore`** - Already excludes `.env` and sensitive files

## Emergency: Rotating Compromised Keys

If your anon key is compromised:

1. **Immediately rotate in Supabase**:
   - Supabase Dashboard → Project Settings → API
   - Click **Generate New Key** under anon key
   - Old key will stop working

2. **Update GitHub Secret**:
   - Repository Settings → Secrets → Actions
   - Find `PUBLIC_SUPABASE_ANON_KEY`
   - Click **Update** and paste new key

3. **Trigger rebuild**:
   - Go to Actions tab
   - Click "Deploy Astro to GitHub Pages"
   - Click "Run workflow"

## Need Help?

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- GitHub Secrets Docs: https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions
- Astro Environment Variables: https://docs.astro.build/en/guides/environment-variables/
