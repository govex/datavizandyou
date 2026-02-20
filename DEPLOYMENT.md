# Deployment Guide

This guide will walk you through deploying your GovEx Data Visualization app to Netlify.

## Prerequisites

- A Netlify account (free tier is sufficient)
- Your Google Sheets published as CSV
- A Google Form for feedback (optional)

## Step 1: Prepare Your Data Sources

### Publish Your Google Sheets

1. Open your Google Sheet with the data
2. Make sure your data is formatted correctly:
   ```
   | Label     | Value |
   |-----------|-------|
   | Excel     | 45    |
   | Tableau   | 30    |
   | Power BI  | 15    |
   ```

3. Go to **File > Share > Publish to web**
4. In the "Link" tab:
   - Select the specific sheet you want to publish
   - Choose "Comma-separated values (.csv)" from the dropdown
   - Click "Publish"
5. Copy the published URL
6. Repeat for any additional sheets

### Update Configuration

Edit `src/App.svelte` and replace the placeholder URLs:

```javascript
const TOOLBOX_CSV = 'YOUR_ACTUAL_CSV_URL_HERE';
const CHARTS_CSV = 'YOUR_ACTUAL_CSV_URL_HERE';
const GOOGLE_FORM_URL = 'YOUR_GOOGLE_FORM_URL_HERE';
```

## Step 2: Deploy to Netlify

### Option A: Deploy via GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure data sources"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Choose "GitHub" and authorize Netlify
   - Select your repository

3. **Configure build settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 20 (set in netlify.toml)
   
4. Click "Deploy site"

5. Wait for the build to complete (usually 1-2 minutes)

6. Your site is now live! Netlify will provide a URL like `https://amazing-app-123456.netlify.app`

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI globally**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize your site**:
   ```bash
   netlify init
   ```
   
   Follow the prompts:
   - Choose "Create & configure a new site"
   - Select your team
   - Choose a site name (or let Netlify generate one)
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

5. Your site is now live!

### Option C: Manual Deploy via Drag & Drop

1. **Build your site locally**:
   ```bash
   npm run build
   ```

2. **Go to Netlify Drop**:
   - Visit [app.netlify.com/drop](https://app.netlify.com/drop)
   - Drag and drop the `dist` folder

3. Your site is now live!

## Step 3: Set Up Webhooks (Optional)

To enable real-time updates when your Google Sheets data changes:

1. **Get your webhook URL**:
   - After deployment, your webhook will be at:
   - `https://your-site-name.netlify.app/.netlify/functions/webhook`

2. **Configure Google Apps Script**:
   - Follow the instructions in [APPS_SCRIPT_SETUP.md](./APPS_SCRIPT_SETUP.md)
   - Replace `YOUR_NETLIFY_WEBHOOK_URL` with your actual webhook URL

3. **Test the webhook**:
   - Make an edit to your Google Sheet
   - Check the Apps Script logs
   - Verify the webhook was triggered

## Step 4: Custom Domain (Optional)

1. In Netlify dashboard, go to **Site settings > Domain management**
2. Click "Add custom domain"
3. Follow the instructions to configure your DNS
4. Netlify will automatically provision an SSL certificate

## Step 5: Verify Deployment

1. Visit your deployed site
2. Check that both charts are displaying
3. Verify the QR code appears
4. Test on mobile devices
5. Make a change to your Google Sheet and verify updates appear

## Troubleshooting

### Build Fails

- Check the Netlify build logs
- Ensure Node version 20 is being used
- Verify all dependencies are in package.json

### Charts Not Displaying

- Check browser console for errors
- Verify CSV URLs are publicly accessible
- Test CSV URLs in your browser directly
- Check CORS settings on Google Sheets

### Webhook Not Working

- Verify the webhook URL is correct in Apps Script
- Check Netlify function logs
- Ensure Apps Script has proper permissions
- Test webhook with a manual POST request

## Continuous Deployment

With GitHub integration, Netlify will automatically:
- Deploy when you push to your main branch
- Create preview deployments for pull requests
- Run builds in a clean environment each time

## Environment Variables (Advanced)

For better security, you can use Netlify environment variables:

1. In Netlify dashboard, go to **Site settings > Environment variables**
2. Add variables like:
   - `VITE_TOOLBOX_CSV_URL`
   - `VITE_CHARTS_CSV_URL`
   - `VITE_FORM_URL`

3. Update `src/App.svelte` to use them:
   ```javascript
   const TOOLBOX_CSV = import.meta.env.VITE_TOOLBOX_CSV_URL;
   ```

4. Redeploy your site

## Monitoring

Monitor your deployment:
- **Analytics**: Enable Netlify Analytics
- **Logs**: View function logs in Netlify dashboard
- **Forms**: Track form submissions if you add Netlify Forms

## Next Steps

- Set up Google Analytics
- Add more visualizations
- Customize colors and branding
- Add authentication if needed
- Set up A/B testing with Netlify

## Support

If you encounter issues:
1. Check the [Netlify Documentation](https://docs.netlify.com/)
2. Review the [Troubleshooting](#troubleshooting) section
3. Check your Netlify build logs
4. Open an issue on GitHub

## Cost

- Netlify free tier includes:
  - 100GB bandwidth per month
  - Unlimited personal sites
  - Continuous deployment
  - HTTPS
  - 125k serverless function requests

This is more than enough for most small to medium projects!
