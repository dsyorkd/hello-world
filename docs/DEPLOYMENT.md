# Complete Deployment Guide

This guide walks you through deploying the hello-world application to Cloudflare Pages from start to finish.

## Overview

This deployment process includes:
- Setting up a Cloudflare D1 database
- Configuring GitHub repository secrets
- Deploying the React application
- Setting up automated CI/CD

**Estimated Time:** 15-20 minutes

## Step-by-Step Deployment

### Phase 1: Local Setup & Verification

#### 1.1 Clone and Install

```bash
# Clone the repository
git clone https://github.com/dsyorkd/hello-world.git
cd hello-world

# Install dependencies
npm install

# Build the application
npm run build
```

**Verify:** You should see a `dist/` directory with the built application.

#### 1.2 Test Locally (Optional)

```bash
# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application running.

### Phase 2: Cloudflare D1 Setup

#### 2.1 Install and Authenticate Wrangler

```bash
# Login to Cloudflare
npx wrangler login
```

This opens your browser for authentication.

#### 2.2 Create D1 Database

```bash
# Create the database
npx wrangler d1 create hello-world-db
```

**Important:** Copy the entire output, especially the `database_id`.

Example output:
```
✅ Successfully created DB 'hello-world-db'

[[d1_databases]]
binding = "DB"
database_name = "hello-world-db"
database_id = "12345678-1234-1234-1234-123456789012"
```

#### 2.3 Update Configuration

Edit `wrangler.toml` and replace `PLACEHOLDER_DB_ID` with your actual database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "hello-world-db"
database_id = "12345678-1234-1234-1234-123456789012"  # Your actual ID
migrations_dir = "migrations"
```

#### 2.4 Run Migrations

```bash
# Apply database schema
npx wrangler d1 migrations apply hello-world-db
```

**Expected Output:**
```
🌀 Mapping SQL input into an array of statements
🌀 Executing on hello-world-db (12345678-1234-1234-1234-123456789012):
✅ Successfully applied 1 migration(s)!
```

#### 2.5 Verify Database

```bash
# Query the database
npx wrangler d1 execute hello-world-db --command "SELECT * FROM greetings"
```

You should see 2 sample greetings in the output.

### Phase 3: GitHub Configuration

#### 3.1 Get Cloudflare Credentials

**Get API Token:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click profile icon → My Profile → API Tokens
3. Click "Create Token"
4. Use "Create Custom Token"
5. Set permissions:
   - Account → Cloudflare Pages → Edit
6. Click "Continue to summary" → "Create Token"
7. **Copy the token** (you won't see it again!)

**Get Account ID:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select any domain or go to Workers & Pages
3. Look for "Account ID" in the right sidebar
4. Copy the ID

#### 3.2 Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these two secrets:

**Secret 1:**
- Name: `CLOUDFLARE_API_TOKEN`
- Value: [Paste your API token]

**Secret 2:**
- Name: `CLOUDFLARE_ACCOUNT_ID`
- Value: [Paste your Account ID]

### Phase 4: Deploy Application

#### 4.1 Push Code (if not already done)

```bash
git add .
git commit -m "Setup complete"
git push origin main
```

#### 4.2 Monitor Deployment

1. Go to your GitHub repository
2. Click the **Actions** tab
3. Watch the "Deploy to Cloudflare" workflow

The workflow will:
- ✅ Install dependencies
- ✅ Build the application
- ✅ Deploy to Cloudflare Pages
- ✅ Provide deployment URL

#### 4.3 Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# Build first
npm run build

# Deploy to Cloudflare
npx wrangler pages deploy dist --project-name=hello-world-app
```

### Phase 5: Bind D1 to Pages Project

After first deployment, bind the database to your Pages project:

#### Option A: Via Dashboard (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Click on **hello-world-app**
4. Go to **Settings** → **Functions**
5. Scroll to **D1 database bindings**
6. Click **Add binding**
7. Set:
   - Variable name: `DB`
   - D1 database: `hello-world-db`
8. Click **Save**

#### Option B: Via Wrangler

```bash
npx wrangler pages deployment create hello-world-app \
  --branch=main \
  --d1=DB=hello-world-db
```

### Phase 6: Verify Deployment

#### 6.1 Find Your URL

After deployment, you'll receive a URL like:
- `https://hello-world-app.pages.dev`
- Or a custom domain if configured

#### 6.2 Test the Application

1. Visit the deployment URL
2. You should see the "Cloudflare Hello World" page
3. The page should load 2 sample greetings from the database
4. Try adding a new greeting
5. Verify it appears in the list

#### 6.3 Test API Directly

```bash
# Test GET endpoint
curl https://hello-world-app.pages.dev/api/greetings

# Test POST endpoint
curl -X POST https://hello-world-app.pages.dev/api/greetings \
  -H "Content-Type: application/json" \
  -d '{"message":"Test from CLI"}'
```

## Troubleshooting

### Build Fails

**Error:** Dependencies not installed
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Not Connected

**Error:** "DB is not defined" or similar

**Solution:**
1. Verify D1 binding in Cloudflare Dashboard
2. Ensure variable name is exactly `DB`
3. Redeploy after adding binding

### Deployment Workflow Fails

**Error:** Authentication failed

**Solution:**
1. Verify GitHub secrets are correct
2. Check API token hasn't expired
3. Ensure token has correct permissions

### API Returns 500 Error

**Error:** API endpoints return server errors

**Solution:**
1. Check database binding is configured
2. Verify migrations were applied
3. Check Cloudflare Functions logs in dashboard

## Post-Deployment

### Custom Domain (Optional)

1. Go to Pages project in Cloudflare Dashboard
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain
5. Follow DNS configuration instructions

### Monitoring

- **View Logs:** Cloudflare Dashboard → Pages → Your project → Functions → Logs
- **Analytics:** Available in the Cloudflare Dashboard
- **Real-time monitoring:** Built into Cloudflare Pages

### Continuous Deployment

With everything set up:
- Push to `main` branch = automatic deployment
- GitHub Actions runs tests and deploys
- Validation workflow checks deployment health

## Maintenance

### Updating the Application

```bash
# Make your changes
git add .
git commit -m "Your changes"
git push origin main

# Deployment happens automatically
```

### Database Maintenance

```bash
# View data
npx wrangler d1 execute hello-world-db --command "SELECT COUNT(*) FROM greetings"

# Backup data
npx wrangler d1 export hello-world-db > backup.sql

# Add new migration
# Create new file in migrations/ directory
# Run: npx wrangler d1 migrations apply hello-world-db
```

### Rollback Deployment

If something goes wrong:

1. Go to Cloudflare Dashboard → Pages → Your project
2. Click **Deployments**
3. Find a previous successful deployment
4. Click **⋯** → **Rollback to this deployment**

## Security Checklist

- [ ] GitHub secrets are configured (not in code)
- [ ] API token has minimal required permissions
- [ ] Two-factor authentication enabled on Cloudflare
- [ ] Branch protection rules configured
- [ ] .gitignore includes sensitive files
- [ ] Dependencies are up to date

## Next Steps

Once deployed, consider:

1. **Custom Domain:** Set up your own domain
2. **Monitoring:** Configure alerts for errors
3. **Analytics:** Review usage patterns
4. **Scaling:** Add caching strategies if needed
5. **Features:** Extend the application with new functionality

## Support Resources

- **Cloudflare D1:** https://developers.cloudflare.com/d1/
- **Cloudflare Pages:** https://developers.cloudflare.com/pages/
- **Wrangler Docs:** https://developers.cloudflare.com/workers/wrangler/
- **GitHub Actions:** https://docs.github.com/en/actions

## Conclusion

Your application is now:
- ✅ Built with React and Vite
- ✅ Deployed to Cloudflare Pages
- ✅ Connected to D1 database
- ✅ Automated with CI/CD

Any push to the main branch will automatically build, test, and deploy your application!
