# hello-world

A React application deployed on Cloudflare Pages with D1 (SQLite) database integration.

## Features

- ⚛️ React 19 with Vite for fast development
- ☁️ Cloudflare Pages for global edge deployment
- 🗄️ Cloudflare D1 (SQLite) for serverless database
- 🔄 CI/CD with GitHub Actions
- 📝 Simple greeting message board

## Prerequisites

- Node.js 20+ 
- npm or yarn
- Cloudflare account
- Wrangler CLI

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```
   
   This starts the Vite dev server at http://localhost:3000

3. **Build the application:**
   ```bash
   npm run build
   ```

## Cloudflare Setup

### 1. Create D1 Database

```bash
npx wrangler d1 create hello-world-db
```

This command will output a database ID. Update the `database_id` in `wrangler.toml` with this value.

### 2. Run Database Migrations

```bash
npx wrangler d1 migrations apply hello-world-db
```

### 3. Local Testing with D1

```bash
npm run build
npm run cf:dev
```

## GitHub Secrets Configuration

The following secrets need to be configured in your GitHub repository:

### Required Secrets

1. **CLOUDFLARE_API_TOKEN**
   - Go to Cloudflare Dashboard → My Profile → API Tokens
   - Create a token with "Cloudflare Pages - Edit" permissions
   - Copy the token value

2. **CLOUDFLARE_ACCOUNT_ID**
   - Found in Cloudflare Dashboard → Account Home
   - Look for "Account ID" in the right sidebar

### Setting Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with the name and value

## Deployment

### Automatic Deployment

Pushing to the `main` or `master` branch automatically triggers deployment via GitHub Actions.

### Manual Deployment

```bash
npm run build
npm run deploy
```

Or trigger the workflow manually from the GitHub Actions tab.

## GitHub Actions Workflows

### 1. Test Workflow (`.github/workflows/test.yml`)
- Runs on all pushes and pull requests
- Builds the application
- Verifies build outputs

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)
- Triggers on push to main/master branch
- Builds and deploys to Cloudflare Pages
- Uses GitHub secrets for authentication

### 3. Validate Workflow (`.github/workflows/validate.yml`)
- Runs after successful deployment
- Tests homepage accessibility
- Validates API endpoints

## Project Structure

```
hello-world/
├── src/
│   ├── App.jsx          # Main React component
│   ├── App.css          # Component styles
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── functions/
│   └── api/
│       └── greetings.js # Cloudflare Functions API
├── migrations/
│   └── 0001_init_greetings.sql  # Database schema
├── .github/
│   └── workflows/       # CI/CD workflows
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── wrangler.toml        # Cloudflare configuration
└── package.json         # Project dependencies
```

## API Endpoints

### GET /api/greetings
Fetches all greetings from the D1 database.

**Response:**
```json
{
  "greetings": [
    {
      "id": 1,
      "message": "Hello World",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### POST /api/greetings
Creates a new greeting.

**Request Body:**
```json
{
  "message": "Your greeting message"
}
```

**Response:**
```json
{
  "success": true,
  "id": 2
}
```

## Database Schema

```sql
CREATE TABLE greetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL
);
```

## Troubleshooting

### D1 Database Not Found
Make sure you've created the database and updated `wrangler.toml` with the correct `database_id`.

### Deployment Fails
1. Verify GitHub secrets are correctly set
2. Check Cloudflare API token has proper permissions
3. Review GitHub Actions logs for specific errors

### Local Development Issues
- Ensure Node.js version is 20 or higher
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check that port 3000 is available

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC
