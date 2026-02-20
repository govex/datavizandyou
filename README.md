# DataViz and You - GovEx Data Visualization Dashboard

A mobile-first web application that visualizes data from Google Sheets using D3.js and Svelte, with real-time updates via webhooks.

## Features

- 📊 Two interactive horizontal bar charts:
  - GovEx Tool Box
  - GovEx Most Used Charts
- 📱 Mobile-first responsive design
- 🔄 Real-time data updates via Google Apps Script webhooks
- 📲 QR code for easy survey access
- ⚡ Fast performance with Vite and Svelte 5
- 🎨 Beautiful, accessible visualizations with D3.js

## Tech Stack

- **Frontend**: Svelte 5 with Vite
- **Visualization**: D3.js v7
- **Hosting**: Netlify
- **Data Source**: Google Sheets (published as CSV)
- **Updates**: Google Apps Script with webhooks

## Quick Start

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- A Google account with access to Google Sheets

### Installation

1. Clone the repository:
```bash
git clone https://github.com/govex/datavizandyou.git
cd datavizandyou
```

2. Install dependencies:
```bash
npm install
```

3. Configure your data sources in `src/App.svelte`:
```javascript
const TOOLBOX_CSV = 'your-google-sheets-csv-url-1';
const CHARTS_CSV = 'your-google-sheets-csv-url-2';
const GOOGLE_FORM_URL = 'your-google-form-url';
```

4. Run the development server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment to Netlify

### Option 1: Netlify CLI (Recommended)

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Initialize and deploy:
```bash
netlify init
netlify deploy --prod
```

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Go to [Netlify](https://app.netlify.com)
3. Click "New site from Git"
4. Connect your GitHub repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

### Option 3: Manual Deploy

1. Build your site:
```bash
npm run build
```

2. Drag and drop the `dist` folder to [Netlify Drop](https://app.netlify.com/drop)

## Setting Up Google Sheets Integration

### 1. Publish Your Google Sheets as CSV

1. Open your Google Sheet
2. Go to File > Share > Publish to web
3. Select the specific sheet (e.g., "ToolBox" or "Charts")
4. Choose "Comma-separated values (.csv)" format
5. Click "Publish"
6. Copy the URL and update it in `src/App.svelte`

### 2. Configure Google Apps Script Webhooks

See [APPS_SCRIPT_SETUP.md](./APPS_SCRIPT_SETUP.md) for detailed instructions on:
- Setting up Google Apps Script
- Configuring webhooks
- Creating automatic triggers
- Testing the integration

### 3. Update Webhook URL

After deploying to Netlify, update your Google Apps Script with your webhook URL:
```
https://your-site.netlify.app/.netlify/functions/webhook
```

## Data Format

Your Google Sheets should have the following format:

| Label | Value |
|-------|-------|
| Item 1 | 45 |
| Item 2 | 30 |
| Item 3 | 15 |

- **Column 1**: Labels for the bars (text)
- **Column 2**: Numeric values for the bars

## Project Structure

```
datavizandyou/
├── src/
│   ├── lib/
│   │   └── components/
│   │       ├── HorizontalBarChart.svelte  # D3 bar chart component
│   │       └── QRCode.svelte              # QR code component
│   ├── App.svelte                         # Main application
│   └── main.js                            # Application entry point
├── netlify/
│   └── functions/
│       └── webhook.js                     # Webhook endpoint
├── public/                                # Static assets
├── index.html                             # HTML template
├── vite.config.js                         # Vite configuration
├── svelte.config.js                       # Svelte configuration
├── netlify.toml                           # Netlify configuration
├── package.json                           # Dependencies
├── APPS_SCRIPT_SETUP.md                  # Apps Script guide
└── README.md                              # This file
```

## Mobile-First Design

The application is built with mobile-first principles:

- Responsive layouts that adapt from mobile to desktop
- Touch-friendly interactive elements
- Optimized performance for mobile devices
- Progressive enhancement for larger screens

## Customization

### Changing Colors

Edit the color props in `src/App.svelte`:

```svelte
<HorizontalBarChart 
  data={toolBoxData} 
  color="#4A90E2"  <!-- Change this -->
  height={300}
/>
```

### Adjusting Chart Height

Modify the `height` prop:

```svelte
<HorizontalBarChart 
  data={toolBoxData} 
  color="#4A90E2"
  height={400}  <!-- Increase for taller charts -->
/>
```

### Styling

Global styles are in `src/App.svelte` within the `<style>` tag. Component-specific styles are in their respective `.svelte` files.

## Troubleshooting

### Charts not displaying

- Check browser console for errors
- Verify CSV URLs are correct and publicly accessible
- Ensure data format matches expected structure

### Webhook not working

- Check Netlify function logs
- Verify webhook URL in Google Apps Script
- Ensure Apps Script has proper permissions

### Build errors

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 20+)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review the Apps Script setup guide

## Acknowledgments

- Built with [Svelte](https://svelte.dev/)
- Visualizations powered by [D3.js](https://d3js.org/)
- Hosted on [Netlify](https://www.netlify.com/)
- Data from Google Sheets