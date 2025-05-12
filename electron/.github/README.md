# Auto-Update Setup for GitHub Releases

To enable automatic publishing to GitHub Releases, you need to set up a GitHub Personal Access Token (PAT) with appropriate permissions.

## Setting up GitHub Token

1. Go to your GitHub account settings
2. Navigate to Developer Settings > Personal Access Tokens > Tokens (classic)
3. Generate a new token with the following permissions:
   - `repo` (Full control of private repositories)
   - `workflow` (if using GitHub Actions)

## Using the Token for Publishing

There are several ways to provide the token:

### Option 1: Environment Variable

Set the `GH_TOKEN` environment variable before running the publish command:

```bash
export GH_TOKEN=your_github_token_here
npm run publish
```

### Option 2: .env File (Not Committed to Repository)

Create a `.env` file in the electron directory with:

```
GH_TOKEN=your_github_token_here
```

### Option 3: CI/CD Pipeline Secret

If using GitHub Actions, add the token as a repository secret and reference it in your workflow.

## Testing Auto-Update

To test the auto-update functionality:

1. Publish a release with the current version
2. Increment the version number in `package.json`
3. Make some changes to the application
4. Publish a new release
5. Open the old version of the application and it should detect and download the update
