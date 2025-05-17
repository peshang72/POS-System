# DigitalOcean App Platform Deployment Guide

This guide will walk you through deploying your POS system on DigitalOcean App Platform.

## Prerequisites

1. A DigitalOcean account (sign up at https://www.digitalocean.com/)
2. Your code pushed to a GitHub repository
3. DigitalOcean CLI (doctl) installed (optional, for command-line deployment)

## Step 1: Prepare Your Repository

1. Ensure your code is pushed to a GitHub repository
2. Verify that you have the following files:
   - `app.yaml` in the root directory
   - `.do/deploy.template.yaml`

## Step 2: Deploy via DigitalOcean Dashboard

### Option A: Using the Web UI

1. Log in to your DigitalOcean account
2. Go to the App Platform section
3. Click "Create App"
4. Select GitHub as your source
5. Connect your GitHub account if not already connected
6. Select your POS system repository
7. Choose the branch you want to deploy (usually `main` or `master`)
8. DigitalOcean will detect your `app.yaml` file and configure your app accordingly
9. Review the app configuration
10. Set environment variables:
    - `JWT_SECRET`: Generate a strong random string
11. Choose a plan (Basic or Professional)
12. Click "Create Resources"

### Option B: Using the DigitalOcean CLI (doctl)

```bash
# Install doctl if you haven't already
brew install doctl  # On macOS with Homebrew
# For other platforms, see: https://docs.digitalocean.com/reference/doctl/how-to/install/

# Authenticate with your API token
doctl auth init

# Deploy your app (from the repository root directory)
doctl apps create --spec .do/deploy.template.yaml
```

## Step 3: Monitor Deployment

1. Wait for the build and deployment process to complete
2. Monitor the build logs for any errors
3. Once deployment is successful, you'll get a URL for your application

## Step 4: Configure Your Domain (Optional)

1. From your app's overview page, go to the "Settings" tab
2. Under "Domains," click "Add Domain"
3. Enter your domain name and configure DNS settings as instructed

## Step 5: Configure MongoDB

DigitalOcean will automatically create and manage a MongoDB database for your application based on the configuration in `app.yaml`. The connection details will be injected into your environment variables.

## Step 6: Post-Deployment Tasks

1. Access your application using the provided URL
2. Test all functionality to ensure it works correctly
3. Set up any initial data or admin users as needed

## Troubleshooting

If you encounter issues during deployment:

1. Check the build logs for error messages
2. Verify that all environment variables are correctly set
3. Make sure your MongoDB connection is working
4. Check that your server's health check endpoint (`/api/health`) is responding correctly

## Scaling and Management

- You can scale your application horizontally or vertically from the Resources tab
- Monitor your application's performance using the Metrics tab
- Set up alerts for important events
- Configure auto-scaling if needed (Professional plan only)

## Maintenance and Updates

To update your application:

1. Push changes to your GitHub repository
2. DigitalOcean will automatically rebuild and redeploy your application (if deploy on push is enabled)
3. Monitor the deployment for success

You can also manually trigger a deployment from the DigitalOcean dashboard.
