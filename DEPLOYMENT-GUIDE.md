# Global Connect Passport - Deployment Guide

## Prerequisites

- Twilio account with SMS capability
- Airtable account (free tier works)
- Guest data ready (Name, Phone, Country, LinkedIn, ID Code)

---

## Step 1: Airtable Setup

### 1.1 Create Base
1. Go to https://airtable.com
2. Create new base: "Global-Connect-Passport"

### 1.2 Create Guests Table
1. Create table named "Guests"
2. Add fields (see `airtable-schema.md` for details):
   - ID_Code (Number, Integer, Required)
   - Name (Single line text, Required)
   - Phone (Phone number, Required)
   - Country (Single line text, Required)
   - LinkedIn (URL, Optional)
   - Activated (Checkbox, default unchecked)
   - Gift_Redeemed (Checkbox, default unchecked)

### 1.3 Create Stamps Table
1. Create table named "Stamps"
2. Add fields:
   - Stamp_ID (Autonumber)
   - Collector (Link to Guests, single record)
   - Collected_Code (Number, Integer)
   - Timestamp (Created time)

### 1.4 Add Link Field to Guests
1. In Guests table, add field:
   - Stamps_Collected (Link to Stamps, allow multiple)
2. Add formula field:
   - Stamp_Count: `LEN({Stamps_Collected})`

### 1.5 Import Guest Data
1. Prepare CSV with columns: ID_Code, Name, Phone, Country, LinkedIn
2. Phone numbers MUST be in E.164 format (+15551234567)
3. Import via Airtable: File → Import data

### 1.6 Get API Credentials
1. Go to https://airtable.com/create/tokens
2. Create new personal access token
3. Name: "Global Connect Passport"
4. Scopes: `data.records:read`, `data.records:write`
5. Add your base to the token
6. **Copy token** (you won't see it again!)
7. Get Base ID from URL: https://airtable.com/appXXXXXXXXXXXXXX/...

---

## Step 2: Twilio Functions Setup

### 2.1 Create Service
1. Login to Twilio Console
2. Go to Functions & Assets → Services
3. Click "Create Service"
4. Name: "global-connect-passport"

### 2.2 Add Dependencies
1. In Service, go to Settings → Dependencies
2. Add:
   - `airtable` version `0.12.2`

### 2.3 Environment Variables
1. In Service, go to Settings → Environment Variables
2. Add:
   - `AIRTABLE_API_KEY` = your Airtable token
   - `AIRTABLE_BASE_ID` = your base ID (appXXXXXXXXXXXXXX)
   - `RESET_CONFIRM_CODE` = create a secret code (e.g., "RESET2024")

### 2.4 Upload Functions
1. Create new Functions in service:

**Function 1: /lookup-guest**
- Path: `/lookup-guest`
- Visibility: Protected
- Copy code from `twilio-functions/lookup-guest.js`

**Function 2: /validate-stamp**
- Path: `/validate-stamp`
- Visibility: Protected
- Copy code from `twilio-functions/validate-stamp.js`

**Function 3: /get-stats**
- Path: `/get-stats`
- Visibility: Public (for dashboard)
- Copy code from `twilio-functions/get-stats.js`

**Function 4: /reset-game**
- Path: `/reset-game`
- Visibility: Protected
- Copy code from `twilio-functions/reset-game.js`

**Function 5: /mark-redemption**
- Path: `/mark-redemption`
- Visibility: Protected
- Copy code from `twilio-functions/mark-redemption.js`

### 2.5 Deploy Functions
1. Click "Deploy All" in top right
2. Wait for deployment to complete
3. Note your Functions domain: `https://YOUR-SUBDOMAIN.twil.io`

---

## Step 3: Twilio Studio Flow

### 3.1 Create Flow
1. Go to Twilio Studio → Flows
2. Click "Create new Flow"
3. Name: "Global Connect Passport"
4. Choose "Start from scratch"

### 3.2 Build Flow (Manual Method)
Follow the flow structure in `ARCHITECTURE.md` to build manually, or:

### 3.2 Import Flow (Recommended)
1. Open `twilio-studio-flow.json`
2. Replace all instances of:
   - `YOUR-SUBDOMAIN.twil.io` with your actual domain
3. In Studio, use "Import from JSON" (if available)
4. Otherwise, build manually following the JSON structure

### 3.3 Key Flow Steps
1. **Trigger**: Incoming SMS
2. **Parse Message**: Extract phone and code
3. **HTTP Request**: Call `/validate-stamp` function
4. **Branching Logic**:
   - If action = "activate" → Send welcome message
   - If action = "stamp_collected" → Send stamp messages (to both parties)
   - If action = "error" → Send error message
5. **Completion Check**: If 5th stamp, send completion message

### 3.4 Publish Flow
1. Click "Publish" in Studio
2. Copy Flow SID (starts with FW...)

---

## Step 4: Phone Number Configuration

### 4.1 Buy/Configure Number
1. Go to Phone Numbers → Manage → Active Numbers
2. Select your SMS-capable number (or buy one)

### 4.2 Link to Studio Flow
1. In Phone Number settings:
2. Under "Messaging Configuration"
3. Configure with: "Studio Flow"
4. Select: "Global Connect Passport"
5. Save

---

## Step 5: Admin Dashboard

### 5.1 Edit Dashboard HTML
1. Open `admin-dashboard.html`
2. Update line 144: `const TWILIO_FUNCTIONS_BASE_URL = 'https://YOUR-SUBDOMAIN.twil.io';`
3. Update line 145: `const RESET_CONFIRM_CODE = 'YOUR-SECRET-CODE';`

### 5.2 Host Dashboard

**Option A: Twilio Assets** (Recommended)
1. In your Twilio Service, go to Assets
2. Upload `admin-dashboard.html`
3. Set visibility to "Protected" or "Public" (if needed)
4. Access via: `https://YOUR-SUBDOMAIN.twil.io/admin-dashboard.html`

**Option B: External Hosting**
1. Upload to any web host
2. Ensure CORS is enabled for Twilio Functions

---

## Step 6: Testing

### 6.1 Test Activation
1. Text your own ID code to the Twilio number
2. You should receive: "Welcome, [Your Name]! Your passport is active..."

### 6.2 Test Stamp Collection
1. Text someone else's ID code
2. Both you and they should receive messages
3. Check Airtable to verify Stamp record created

### 6.3 Test Edge Cases
- Invalid code (999)
- Self-scan (your own code again)
- Duplicate stamp (same code twice)
- Same country stamp

### 6.4 Test Completion
1. Collect 5 stamps from different countries
2. You should receive completion message

### 6.5 Test Dashboard
1. Open admin dashboard URL
2. Verify stats are loading
3. Test mark redemption button
4. Test reset game (with caution!)

---

## Step 7: Event Day Setup

### 7.1 Print Signage
Create signs with:
- "Text your badge code to [TWILIO_NUMBER] to activate your Global Passport!"
- QR code linking to SMS (format: `sms:+1XXXYYYZZZZ`)

### 7.2 Staff Training
- Show attendants the admin dashboard
- Explain gift redemption process
- Have support number ready

### 7.3 Pre-Event Check
- [ ] All guest data imported
- [ ] Test messages sending successfully
- [ ] Dashboard loading correctly
- [ ] Gift redemption station ready
- [ ] Art wall materials prepared

---

## Troubleshooting

### Messages Not Sending
- Check Twilio debugger for errors
- Verify phone numbers are E.164 format
- Check Function logs for errors

### Airtable Errors
- Verify API key and base ID
- Check API rate limits (5 requests/second free tier)
- Ensure field names match exactly

### Dashboard Not Loading
- Check browser console for errors
- Verify Functions URL is correct
- Ensure Functions visibility is "Public" for get-stats

### Stamps Not Recording
- Check Airtable Stamps table
- Verify link fields are configured correctly
- Check Function logs in Twilio Console

---

## Post-Event

### Export Data
1. Go to Airtable
2. Export Stamps table to CSV
3. Export Guests table to CSV
4. Archive for records

### Cost Analysis
- Check Twilio SMS usage
- Check Airtable API usage
- Review for future events

---

## Support

### Twilio Console
- Functions logs: Functions → [Service] → Logs
- SMS logs: Monitor → Logs → Messaging

### Airtable
- API status: https://status.airtable.com
- Usage: Account → Billing

---

## Security Notes

1. Keep AIRTABLE_API_KEY secret (use environment variables)
2. Use HTTPS for all dashboard access
3. Limit admin dashboard visibility (Twilio Protected Assets)
4. Use strong RESET_CONFIRM_CODE
5. Consider IP allowlisting for production

---

## Estimated Costs

**Twilio:**
- SMS: $0.0075 per message
- Phone number: ~$1/month
- Functions: Free (included)

**Airtable:**
- Free tier: 1,200 records/base (sufficient for most events)

**Example:** 100 guests, average 6 messages each = 600 SMS = ~$4.50

---

## Next Steps After Deployment

1. ✅ Test with small group (5-10 people)
2. ✅ Verify all messages sending
3. ✅ Test dashboard functionality
4. ✅ Train staff on system
5. ✅ Print event signage
6. ✅ Have backup plan (manual tracking sheet)

---

**Questions?** Contact your Twilio Developer (Todd A.)
