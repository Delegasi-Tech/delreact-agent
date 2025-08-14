# GitHub Pages Setup Guide

This guide explains how to set up GitHub Pages for the delreact-agent repository to automatically deploy the Docusaurus documentation.

## Overview

The delreact-agent repository includes:
- Complete Docusaurus documentation in the `/docs` directory
- Automated GitHub workflow for deploying to GitHub Pages
- Pre-configured settings for GitHub Pages deployment

## Prerequisites

- Repository admin access to enable GitHub Pages
- Documentation source files in the `/docs` directory (already present)
- GitHub Actions workflow file (already configured)

## Step-by-Step Setup

### 1. Enable GitHub Pages in Repository Settings

1. Go to your repository on GitHub: `https://github.com/Delegasi-Tech/delreact-agent`
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. Save the settings

### 2. Verify Workflow Configuration

The repository already includes a pre-configured GitHub Actions workflow at `.github/workflows/deploy-docs.yml` that:
- Triggers on pushes to the `main` branch when files in the `docs/` directory are changed
- Can be manually triggered via `workflow_dispatch`
- Builds the Docusaurus site
- Deploys to GitHub Pages

### 3. Test the Deployment

After enabling GitHub Pages:

1. Make a small change to any file in the `/docs` directory
2. Commit and push to the `main` branch
3. Go to the **Actions** tab in your repository
4. Watch the "Deploy Docusaurus to GitHub Pages" workflow run
5. Once completed, your site will be available at: `https://delegasi-tech.github.io/delreact-agent/`

### 4. Manual Deployment (Optional)

You can also trigger deployment manually:

1. Go to the **Actions** tab
2. Select "Deploy Docusaurus to GitHub Pages" workflow
3. Click **Run workflow**
4. Select the `main` branch
5. Click **Run workflow**

## Configuration Details

### Docusaurus Configuration

The Docusaurus configuration (`docs/docusaurus.config.ts`) is already set up with:
- **URL**: `https://delegasi-tech.github.io`
- **Base URL**: `/delreact-agent/`
- **Organization**: `Delegasi-Tech`
- **Project Name**: `delreact-agent`

### GitHub Actions Workflow

The workflow (`.github/workflows/deploy-docs.yml`) includes:
- **Triggers**: Push to `main` branch with changes in `docs/` directory
- **Permissions**: Proper permissions for GitHub Pages deployment
- **Node.js**: Version 18 setup
- **Dependencies**: Automatic installation from `docs/package-lock.json`
- **Build**: Runs `npm run build` in the docs directory
- **Deploy**: Uses GitHub's official Pages deployment action

## Troubleshooting

### Common Issues

1. **Pages not enabled**: Ensure GitHub Pages is enabled in repository settings with "GitHub Actions" as the source

2. **Workflow fails**: Check the Actions tab for error details. Common issues:
   - Missing dependencies (resolved by `npm ci`)
   - Build errors (check the build logs)
   - Permission issues (workflow has correct permissions)

3. **Site not accessible**: 
   - Verify the site URL: `https://delegasi-tech.github.io/delreact-agent/`
   - Check that the workflow completed successfully
   - Allow a few minutes for DNS propagation

4. **Content not updating**:
   - Ensure changes are pushed to the `main` branch
   - Check that the workflow triggered (changes must be in `docs/` directory)
   - Clear browser cache

### Build Locally

To test the documentation locally before deploying:

```bash
cd docs
npm install
npm run build
npm run serve
```

The site will be available at `http://localhost:3000`

## Maintenance

### Updating Documentation

1. Edit files in the `/docs/contents/` directory
2. Test locally with `npm run start` in the docs directory
3. Commit and push changes to the `main` branch
4. The workflow will automatically deploy the updates

### Updating Dependencies

To update Docusaurus and dependencies:

```bash
cd docs
npm update
npm audit fix
```

Test the build locally before committing the updated `package-lock.json`.

## Support

If you encounter issues with GitHub Pages setup:

1. Check the [GitHub Pages documentation](https://docs.github.com/en/pages)
2. Review the [Docusaurus deployment guide](https://docusaurus.io/docs/deployment#deploying-to-github-pages)
3. Check the repository's Actions tab for workflow logs
4. Open an issue in the repository for specific problems

## Site URL

Once set up, your documentation will be available at:
**https://delegasi-tech.github.io/delreact-agent/**