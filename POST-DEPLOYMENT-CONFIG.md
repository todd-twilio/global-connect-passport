# Post-Deployment Configuration Guide

After deploying this project to Twilio Serverless, you need to update several configuration values with your actual deployment URLs and credentials.

## Step 1: Deploy to Twilio

First, deploy your functions:

```bash
twilio serverless:deploy
```

This will output a URL like: `https://your-service-name-1234-dev.twil.io`

**Copy this URL - you'll need it for the next steps.**

## Step 2: Update Admin Dashboard

Open `assets/admin-dashboard.html` and update line 576-577:

```javascript
// BEFORE:
const TWILIO_FUNCTIONS_BASE_URL = 'https://YOUR-SERVICE-NAME.twil.io';
const RESET_CONFIRM_CODE = 'your_secret_code';

// AFTER:
const TWILIO_FUNCTIONS_BASE_URL = 'https://your-service-name-1234-dev.twil.io'; // Your actual URL
const RESET_CONFIRM_CODE = 'reset2026'; // Your RESET_CONFIRM_CODE from .env
```

## Step 3: Update Map Dashboard

Open `assets/map-dashboard.html` and update line 789:

```javascript
// BEFORE:
const TWILIO_FUNCTIONS_BASE_URL = 'https://YOUR-SERVICE-NAME.twil.io';

// AFTER:
const TWILIO_FUNCTIONS_BASE_URL = 'https://your-service-name-1234-dev.twil.io'; // Your actual URL
```

## Step 4: Update Studio Flow

Open `twilio-studio-flow.json` and update line 61:

```json
"url": "https://your-service-name-1234-dev.twil.io/validate-stamp",
```

Replace `YOUR-SERVICE-NAME` with your actual deployed URL.

## Step 5: Re-deploy

After making these changes, redeploy to push the updated HTML files:

```bash
twilio serverless:deploy --override-existing-project
```

## Step 6: Import Studio Flow

1. Go to [Twilio Studio](https://console.twilio.com/us1/develop/studio/flows)
2. Create new flow → Import from JSON
3. Upload the updated `twilio-studio-flow.json`
4. Publish the flow

## Step 7: Configure Phone Number

1. In Twilio Console → Phone Numbers → [Your Number]
2. Under "Messaging" → "A message comes in"
3. Select "Studio Flow" → Choose your imported flow
4. Save

## Verification Checklist

After deployment, verify:

- [ ] Admin dashboard loads at `https://your-service-name.twil.io/admin-dashboard.html`
- [ ] Dashboard displays statistics correctly (not CORS errors)
- [ ] Map dashboard loads at `https://your-service-name.twil.io/map-dashboard.html`
- [ ] Studio Flow uses correct Function URL
- [ ] Test message flow works end-to-end

## Security Notes

- Never commit the actual deployment URLs to a public repository if they contain sensitive data
- Always use environment variables for credentials (`.env` file)
- Keep your `RESET_CONFIRM_CODE` secret
- The files in this repo are pre-configured with placeholder values for security
