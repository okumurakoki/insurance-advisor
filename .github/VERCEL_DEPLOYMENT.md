# Vercel Deployment Configuration

This document describes the Vercel deployment setup for this project.

## GitHub Secrets Required

The following secrets must be configured in GitHub repository settings:

### Backend Deployment
- `VERCEL_TOKEN`: Your Vercel authentication token
- `VERCEL_ORG_ID`: `team_KiKcsNJDyqr8Ah4GFD9n0yun`
- `VERCEL_PROJECT_ID`: `prj_qLSTYFjRO9WqbuZnEKt0XzRaPzwR` (prudential-insurance-optimizer-api)

### Frontend Deployment
- `VERCEL_TOKEN`: Same as backend (reused)
- `VERCEL_ORG_ID`: Same as backend (reused)
- `VERCEL_PROJECT_ID_FRONTEND`: `prj_WnxFa1M5wya7grRRBTAT04Z8x3Pb` (prudential-insurance-optimizer-frontend)

## Deployment Workflows

### Backend (`deploy-backend.yml`)
- Triggers on push to `main` branch when files in `backend/**` change
- Deploys to: https://api.insurance-optimizer.com
- Project: `prudential-insurance-optimizer-api`

### Frontend (`deploy-frontend.yml`)
- Triggers on push to `main` branch when files in `frontend/**` change
- Deploys to: https://prudential-insurance-optimizer-frontend-kokiokumuras-projects.vercel.app
- Project: `prudential-insurance-optimizer-frontend`

## Safeguards Against Duplicate Projects

Both workflows include:

1. **Secret Verification**: Validates that all required secrets are set before deployment
2. **Hardcoded Fallback**: Uses hardcoded project IDs as fallback to prevent accidental project creation
3. **Dynamic `.vercel/project.json` Creation**: Creates the Vercel config file at deployment time

These safeguards ensure that deployments always target the correct Vercel projects and never accidentally create duplicate projects.

## Local Development

For local Vercel deployments, the `.vercel/project.json` files are configured in:
- `backend/.vercel/project.json`
- `frontend/.vercel/project.json`

These files are in `.gitignore` and are automatically created by the workflows during CI/CD.

## Troubleshooting

If a duplicate project is accidentally created:

1. List all projects: `vercel projects ls`
2. Delete the duplicate: `echo "y" | vercel projects rm <project-name>`
3. Verify the GitHub Secrets are correctly configured
4. Ensure the workflow files have the correct project IDs

## Version Information

- Backend API Version: 1.3.1
- Deployment Method: Direct (`vercel --prod --yes`)
- Node Version: 20.x
