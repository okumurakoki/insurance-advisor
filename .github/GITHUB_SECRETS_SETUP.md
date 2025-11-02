# GitHub Secrets Setup Guide

## Required Secrets

Go to: https://github.com/okumurakoki/insurance-advisor/settings/secrets/actions

Add the following secrets:

### 1. VERCEL_TOKEN
Your Vercel authentication token

**How to get it:**

1. **Login to Vercel**
   - Go to https://vercel.com
   - Make sure you're logged in with your account

2. **Navigate to Tokens page**
   - Go directly to: https://vercel.com/account/tokens
   - Or: Click your profile icon (top right) → Settings → Tokens

3. **Create a new token**
   - Click "Create" button
   - Token Name: `github-actions` (or any name you prefer)
   - Scope: Select your team `kokiokumura's projects` (team_KiKcsNJDyqr8Ah4GFD9n0yun)
   - Expiration: Choose "No Expiration" or set a long expiration date
   - Click "Create Token"

4. **Copy the token**
   - **IMPORTANT**: The token will only be shown ONCE
   - Copy the entire token value (starts with `vercel_...` or similar)
   - Save it somewhere safe temporarily

5. **Alternative: Use existing token**
   - If you already have a token, you can check with CLI:
   ```bash
   vercel whoami
   ```
   - To get your current token from CLI config:
   ```bash
   cat ~/.config/vercel/auth.json
   ```
   - Look for the `token` field in the JSON

6. **Add to GitHub Secrets**
   - Go to: https://github.com/okumurakoki/insurance-advisor/settings/secrets/actions
   - Click "New repository secret"
   - Name: `VERCEL_TOKEN`
   - Value: Paste the token you copied
   - Click "Add secret"

### 2. VERCEL_ORG_ID
Value: `team_KiKcsNJDyqr8Ah4GFD9n0yun`

### 3. VERCEL_PROJECT_ID
Backend project ID
Value: `prj_qLSTYFjRO9WqbuZnEKt0XzRaPzwR`

### 4. VERCEL_PROJECT_ID_FRONTEND
Frontend project ID
Value: `prj_WnxFa1M5wya7grRRBTAT04Z8x3Pb`

## Verification

After setting up all secrets, the GitHub Actions workflows will:
1. Verify the secrets exist
2. Create `.vercel/project.json` with the correct project IDs
3. Deploy to Vercel using the `--force` flag

## Current Status

If you're seeing "Verify Secrets" failure in GitHub Actions, it means one or more of these secrets are missing.

The workflows have fallback to hardcoded values, but it's better to set the secrets properly.
