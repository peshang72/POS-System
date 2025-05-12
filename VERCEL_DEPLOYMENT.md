# Deploying the POS System to Vercel

This guide explains how to deploy your POS system to Vercel with the correct configuration.

## Prerequisites

- A GitHub, GitLab, or Bitbucket account
- Your POS system code pushed to a repository
- A Vercel account (you can sign up at https://vercel.com using your GitHub/GitLab/Bitbucket account)
- MongoDB Atlas account for the database

## Step 1: Fix Build Configuration

Before deploying, make sure your build configuration is correct:

1. Verify your `package.json` has the correct build script:

```json
"build:vercel": "cd client && npm ci && npx vite build && cd ../api && npm ci"
```

2. Verify your `vercel.json` configuration:

```json
{
  "version": 2,
  "buildCommand": "npm run build:vercel",
  "outputDirectory": "client/dist",
  "installCommand": "npm install",
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
  // Additional routes configuration...
}
```

## Step 2: Set Up MongoDB Atlas

1. Create a cluster in MongoDB Atlas
2. Configure network access to allow connections from anywhere (for Vercel)
3. Create a database user with read/write permissions
4. Get your connection string that looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```

## Step 3: Deploy to Vercel

### Option 1: Deploy from GitHub (Recommended)

1. Push your code to a GitHub repository
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Configure the project settings:
   - Root Directory: ./
   - Build Command: npm run build:vercel
   - Output Directory: client/dist
5. Add the following environment variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure secret key for JWT authentication
   - `JWT_EXPIRE`: JWT token expiration time (e.g., "1d")
   - `JWT_COOKIE_EXPIRE`: JWT cookie expiration time in days (e.g., 1)
   - `NODE_ENV`: production
6. Click "Deploy"

### Option 2: Deploy using the CLI

1. Run the deployment script:
   ```bash
   ./deploy-vercel.sh
   ```
2. Follow the prompts to complete the deployment

## Step 4: Verify Deployment

1. Once deployed, visit your Vercel deployment URL
2. Test login functionality to ensure database connection works
3. Check that all pages load properly

## Troubleshooting Common Issues

### Build Failures

- If you get `vite: command not found` errors, make sure your build script is using `npx vite build` instead of `npm run build`
- Ensure all dependencies are properly installed with `npm ci`

### Database Connection Issues

- Verify MongoDB Atlas network access allows connections from everywhere (0.0.0.0/0)
- Confirm your connection string is correctly formatted in the environment variables
- Check MongoDB Atlas user has the correct permissions

### API Errors

- Make sure your API routes are properly configured in vercel.json
- Check environment variables are set correctly in Vercel project settings

For additional help, check the Vercel logs from your project dashboard.
