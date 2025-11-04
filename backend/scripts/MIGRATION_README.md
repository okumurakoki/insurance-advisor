# Database Migration Guide

## Running Migrations on Vercel

### Prerequisites
- Vercel CLI installed (`npm i -g vercel`)
- Vercel project linked to your account
- DATABASE_URL environment variable set in Vercel project

### Steps

1. Install dependencies locally:
```bash
npm install
```

2. Get DATABASE_URL from Vercel:
```bash
vercel env pull .env.local
```

3. Run the migration:
```bash
# For the customer insurance companies migration
DATABASE_URL="<your-database-url>" node scripts/run-migration.js add_customer_insurance_companies.sql
```

### Alternative: Run migration directly on Vercel

You can also run the migration using Vercel CLI:

```bash
# Navigate to backend directory
cd backend

# Run migration via Vercel
vercel exec -- node scripts/run-migration.js add_customer_insurance_companies.sql
```

## Migration Files

- `migrations/add_customer_insurance_companies.sql` - Adds customer-insurance company many-to-many relationship table

## Troubleshooting

If migration fails:
1. Check that DATABASE_URL is correctly set
2. Verify table doesn't already exist
3. Check database connection
4. Review migration SQL for errors

## Rollback

To rollback this migration, you would need to:
1. DROP TABLE customer_insurance_companies
2. Data will be lost unless backed up

Note: Always backup data before running migrations in production!
