# Deployment Guide - Albert Children's Library

## Prerequisites
- Azure account with active subscription
- GitHub account
- Azure CLI installed (`az --version` to verify)

## Step 1: Push to GitHub

1. Create a new repository on GitHub (don't initialize with README)
2. Run these commands:
```bash
git commit -m "Initial commit - Family Library App"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 2: Create Azure Static Web App

### Option A: Using Azure Portal (Recommended)

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → Search for "Static Web App"
3. Fill in the details:
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new or select existing
   - **Name**: `family-library` (or your preferred name)
   - **Plan type**: Free (or Standard if needed)
   - **Region**: Choose closest to you
   - **Deployment source**: GitHub
   - **GitHub account**: Authorize Azure to access your GitHub
   - **Organization**: Your GitHub username
   - **Repository**: Select your repository
   - **Branch**: main
   - **Build Presets**: Custom
   - **App location**: `/web`
   - **Api location**: `/api`
   - **Output location**: `dist`

4. Click "Review + create" → "Create"

### Option B: Using Azure CLI

```bash
# Login to Azure
az login

# Create resource group (if needed)
az group create --name family-library-rg --location eastus

# Create Static Web App with GitHub integration
az staticwebapp create \
  --name family-library \
  --resource-group family-library-rg \
  --source https://github.com/YOUR_USERNAME/YOUR_REPO_NAME \
  --location eastus \
  --branch main \
  --app-location "/web" \
  --api-location "/api" \
  --output-location "dist" \
  --login-with-github
```

## Step 3: Configure Environment Variables in Azure

After deployment, you need to add your secrets:

1. Go to your Static Web App in Azure Portal
2. Click "Configuration" in the left menu
3. Click "Add" and add these Application settings:

   - **Name**: `GOOGLE_CLIENT_EMAIL`
     **Value**: `your-service-account@your-project.iam.gserviceaccount.com`

   - **Name**: `GOOGLE_PRIVATE_KEY`
     **Value**: Your private key (paste the entire key including BEGIN/END lines)

   - **Name**: `SHEET_ID`
     **Value**: Your Google Sheet ID

4. Click "Save"

### Using Azure CLI:
```bash
az staticwebapp appsettings set \
  --name family-library \
  --setting-names \
    GOOGLE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com" \
    GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----" \
    SHEET_ID="your-google-sheet-id"
```

## Step 4: Verify Deployment

1. After deployment completes (5-10 minutes), go to your Static Web App in Azure Portal
2. Click "Browse" to open your live site
3. The URL will be something like: `https://YOUR-APP-NAME.azurestaticapps.net`

## Automatic Deployments

Azure Static Web Apps automatically deploys when you push to the `main` branch:

1. Make changes to your code
2. Commit and push:
```bash
git add .
git commit -m "Your change description"
git push
```
3. GitHub Actions will automatically build and deploy (check the "Actions" tab in GitHub)

## Custom Domain (Optional)

1. In Azure Portal, go to your Static Web App
2. Click "Custom domains"
3. Click "Add" and follow the instructions to add your domain

## Troubleshooting

### Check Application Logs
1. Go to Static Web App → "Application Insights" (if enabled)
2. Or check GitHub Actions logs for build errors

### API Not Working
- Verify environment variables are set correctly in Azure Portal
- Check that the Google Service Account has access to your Sheet
- Review function logs in Azure Portal

### Build Failures
- Check the GitHub Actions workflow file (`.github/workflows/azure-static-web-apps-*.yml`)
- Ensure `package.json` scripts match deployment configuration
