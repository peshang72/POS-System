# Deploying the POS System to Vercel

This guide explains how to deploy your POS system to Vercel for hosting on the web.

## Prerequisites

- A GitHub, GitLab, or Bitbucket account
- Your POS system code pushed to a repository
- A Vercel account (you can sign up at https://vercel.com using your GitHub/GitLab/Bitbucket account)

## Deployment Options

### Option 1: Using the Deployment Script (Recommended)

1. Make sure you're in the root directory of your project
2. Run the deployment script:

```bash
./deploy-vercel.sh
```

3. Follow the prompts to log in to Vercel if needed
4. The script will build your client and deploy your application

### Option 2: Manual Deployment via Vercel CLI

1. Install the Vercel CLI globally:

```bash
npm install -g vercel
```

2. Log in to Vercel:

```bash
vercel login
```

3. Deploy your application:

```bash
vercel --prod
```

4. Follow the interactive prompts to configure your project

### Option 3: Deployment via Vercel Web Interface

1. Push your code to a GitHub/GitLab/Bitbucket repository
2. Log in to your Vercel account at https://vercel.com
3. Click "Add New..." > "Project"
4. Select your repository from the list
5. Configure your project settings:
   - Framework Preset: Other
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/dist`
6. Click "Deploy"

## Environment Variables

Make sure to add the following environment variables in your Vercel project settings:

- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure secret key for JWT authentication
- `JWT_EXPIRE`: JWT token expiration time (e.g., "1d")
- `JWT_COOKIE_EXPIRE`: JWT cookie expiration time in days (e.g., 1)

You can add these in the Vercel dashboard under Project Settings > Environment Variables.

## Custom Domain Setup (Optional)

1. Go to your project in the Vercel dashboard
2. Navigate to "Settings" > "Domains"
3. Add your custom domain and follow the verification steps

## Continuous Deployment

Vercel automatically sets up continuous deployment from your repository. Any push to your main branch will trigger a new deployment.

## Troubleshooting

- If you encounter build errors, check the build logs in the Vercel dashboard
- Ensure your MongoDB connection string is correctly configured in environment variables
- Verify that your `vercel.json` file is properly configured
- Check that your client build is generating the correct output in the `dist` directory
