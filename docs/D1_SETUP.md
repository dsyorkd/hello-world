# Cloudflare D1 Database Setup Guide

This document provides step-by-step instructions for setting up the D1 database for this application.

## Prerequisites

- Cloudflare account with Pages enabled
- Wrangler CLI installed (`npm install -g wrangler` or use the local version)
- Cloudflare API token with appropriate permissions

## Step 1: Authenticate Wrangler

If you haven't already authenticated wrangler with your Cloudflare account:

```bash
npx wrangler login
```

This will open a browser window for you to authorize wrangler.

## Step 2: Create the D1 Database

Run the following command to create a new D1 database:

```bash
npx wrangler d1 create hello-world-db
```

**Expected Output:**
```
✅ Successfully created DB 'hello-world-db'

[[d1_databases]]
binding = "DB"
database_name = "hello-world-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Important:** Copy the `database_id` value from the output.

## Step 3: Update wrangler.toml

Open `wrangler.toml` and replace `PLACEHOLDER_DB_ID` with your actual database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "hello-world-db"
database_id = "your-actual-database-id-here"  # Replace this!
migrations_dir = "migrations"
```

## Step 4: Apply Database Migrations

Run the migration to create the database schema:

```bash
npx wrangler d1 migrations apply hello-world-db
```

This will create the `greetings` table and insert sample data.

## Step 5: Verify Database Setup

You can query your database to verify it's set up correctly:

```bash
npx wrangler d1 execute hello-world-db --command "SELECT * FROM greetings"
```

**Expected Output:**
```
┌────┬──────────────────────────────┬─────────────────────────┐
│ id │ message                      │ created_at              │
├────┼──────────────────────────────┼─────────────────────────┤
│ 1  │ Hello from Cloudflare D1!    │ 2024-01-01 12:00:00     │
│ 2  │ Welcome to our serverless app│ 2024-01-01 11:00:00     │
└────┴──────────────────────────────┴─────────────────────────┘
```

## Step 6: Bind D1 to Cloudflare Pages

When deploying to Cloudflare Pages, you need to bind the D1 database:

### Option A: Via Cloudflare Dashboard

1. Go to Cloudflare Dashboard
2. Navigate to Pages → Your Project → Settings → Functions
3. Under "D1 database bindings", click "Add binding"
4. Variable name: `DB`
5. D1 database: Select `hello-world-db`
6. Save

### Option B: Via Wrangler (Recommended for CI/CD)

The deployment workflow automatically handles this when using the correct project configuration.

## Testing Locally with D1

To test the application locally with the D1 database:

```bash
# Build the application first
npm run build

# Run with D1 binding
npm run cf:dev
```

This starts a local development server with the D1 database connected.

## Troubleshooting

### "Database not found" Error

- Verify you've created the database: `npx wrangler d1 list`
- Check that `database_id` in `wrangler.toml` matches your actual database ID
- Ensure you're logged in: `npx wrangler whoami`

### Migration Fails

- Check the SQL syntax in `migrations/0001_init_greetings.sql`
- Ensure the database exists before running migrations
- Try running migrations with `--remote` flag: `npx wrangler d1 migrations apply hello-world-db --remote`

### Local Development Issues

- Make sure you've built the app first: `npm run build`
- Check that the `dist` directory exists
- Verify wrangler is up to date: `npm update wrangler`

## Managing Data

### Insert Data Manually

```bash
npx wrangler d1 execute hello-world-db \
  --command "INSERT INTO greetings (message, created_at) VALUES ('Test message', datetime('now'))"
```

### Query Data

```bash
npx wrangler d1 execute hello-world-db \
  --command "SELECT * FROM greetings ORDER BY created_at DESC LIMIT 10"
```

### Delete Data

```bash
npx wrangler d1 execute hello-world-db \
  --command "DELETE FROM greetings WHERE id = 1"
```

## Production Considerations

### Data Persistence

- D1 data is persistent across deployments
- Regular backups are recommended
- Consider implementing data export functionality

### Performance

- D1 is edge-distributed for low latency
- Query performance is excellent for small-to-medium datasets
- Consider adding indexes for frequently queried columns

### Scaling

- D1 scales automatically with your Cloudflare Pages deployment
- No manual scaling configuration required
- Suitable for applications with up to millions of rows

## Additional Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)
