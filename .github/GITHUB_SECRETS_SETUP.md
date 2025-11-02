# GitHub Secrets Setup Guide

## Required Secrets

Go to: https://github.com/okumurakoki/insurance-advisor/settings/secrets/actions

Add the following secrets:

### 1. VERCEL_TOKEN
Your Vercel authentication token

**How to get it:**
1. Go to https://vercel.com/account/tokens
2. Create a new token
3. Copy the token value

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
