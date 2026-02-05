# GitHub Secrets Configuration Guide

This document explains how to configure the required GitHub secrets for automated deployment.

## Required Secrets

### 1. CLOUDFLARE_API_TOKEN

This token allows GitHub Actions to deploy your application to Cloudflare Pages.

**How to Create:**

1. Log in to your Cloudflare account
2. Go to **My Profile** (click on your profile picture in top right)
3. Select **API Tokens** from the left sidebar
4. Click **Create Token**
5. Choose **Create Custom Token**
6. Configure the token:
   - **Token name:** `GitHub Actions Deploy`
   - **Permissions:**
     - Account → Cloudflare Pages → Edit
     - Account → D1 → Edit (if managing D1 via API)
   - **Account Resources:** Include → Specific account → Select your account
   - **TTL:** Choose an appropriate expiration (or no expiration for long-term use)
7. Click **Continue to summary**
8. Review and click **Create Token**
9. **Important:** Copy the token immediately - you won't be able to see it again!

### 2. CLOUDFLARE_ACCOUNT_ID

Your Cloudflare Account ID is needed to identify which account to deploy to.

**How to Find:**

1. Log in to your Cloudflare account
2. Go to the **Dashboard home** (Workers & Pages → Overview)
3. On the right side, look for **Account ID**
4. Copy the ID (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

Alternatively:
- Visit any domain in your account
- Look in the right sidebar for **Account ID**

## Adding Secrets to GitHub

### Via GitHub Web Interface

1. Go to your GitHub repository
2. Click on **Settings** (top menu)
3. In the left sidebar, expand **Secrets and variables**
4. Click **Actions**
5. Click **New repository secret**
6. Add each secret:
   - **Name:** `CLOUDFLARE_API_TOKEN`
   - **Secret:** Paste your API token
   - Click **Add secret**
7. Repeat for:
   - **Name:** `CLOUDFLARE_ACCOUNT_ID`
   - **Secret:** Paste your Account ID

### Via GitHub CLI

If you have the GitHub CLI installed:

```bash
# Set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_API_TOKEN

# Set CLOUDFLARE_ACCOUNT_ID
gh secret set CLOUDFLARE_ACCOUNT_ID
```

You'll be prompted to paste the secret value.

## Verifying Secrets

To verify your secrets are configured correctly:

1. Go to your repository's **Actions** tab
2. Manually trigger the **Deploy to Cloudflare** workflow
3. Check the workflow logs for any authentication errors

If you see errors like:
- `Authentication error` → Check your API token
- `Account not found` → Verify your Account ID
- `Insufficient permissions` → Ensure your token has the right permissions

## Security Best Practices

### Token Security

- **Never commit** tokens or secrets to your repository
- Use GitHub Secrets for sensitive data
- Rotate tokens periodically (every 90 days recommended)
- Use tokens with minimal required permissions
- Delete tokens that are no longer needed

### Access Control

- Restrict who can view/edit repository secrets
- Use branch protection rules for production deployments
- Consider using GitHub Environments for staging/production separation
- Enable two-factor authentication on your Cloudflare account

### Monitoring

- Regularly review API token usage in Cloudflare Dashboard
- Monitor GitHub Actions logs for suspicious activity
- Set up notifications for failed deployments

## Optional Secrets

### CLOUDFLARE_DOMAIN (Optional)

If you want to use a custom domain:

**Value:** Your custom domain (e.g., `hello-world.example.com`)

This can be used in validation workflows to test the correct URL.

## Troubleshooting

### "Invalid API Token" Error

**Symptoms:**
- Deployment workflow fails with authentication error
- Error message mentions invalid token

**Solutions:**
1. Verify the token is copied correctly (no extra spaces)
2. Check token hasn't expired
3. Ensure token has correct permissions
4. Generate a new token if needed

### "Account ID not found" Error

**Symptoms:**
- Workflow fails to find your Cloudflare account
- Error message mentions account ID

**Solutions:**
1. Double-check the Account ID is correct
2. Ensure no extra characters or spaces
3. Verify you're using the Account ID, not Zone ID
4. Check you have access to the account

### "Insufficient Permissions" Error

**Symptoms:**
- Token works but can't perform certain actions
- Specific permission errors in logs

**Solutions:**
1. Review token permissions in Cloudflare Dashboard
2. Ensure these permissions are set:
   - Cloudflare Pages: Edit
   - D1: Edit (if managing database)
3. Generate new token with correct permissions

### Secret Not Available in Workflow

**Symptoms:**
- Workflow can't access secrets
- Secret appears empty in workflow

**Solutions:**
1. Verify secret name matches exactly (case-sensitive)
2. Check secret is set at repository level, not organization
3. Ensure workflow has permission to access secrets
4. Re-add the secret if it was recently updated

## Testing Configuration

After adding secrets, test your configuration:

```bash
# Trigger deployment workflow manually
gh workflow run deploy.yml

# Check workflow status
gh run list --workflow=deploy.yml
```

Or use the GitHub web interface:
1. Go to **Actions** tab
2. Select **Deploy to Cloudflare** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

## Environment-Specific Secrets

For multiple environments (staging/production):

1. Create **Environments** in repository settings
2. Add environment-specific secrets
3. Modify workflows to use different environments
4. Use environment protection rules

Example in workflow:
```yaml
jobs:
  deploy:
    environment: production
    # Will use secrets from 'production' environment
```

## Additional Resources

- [GitHub Encrypted Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Cloudflare API Tokens Documentation](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments)
