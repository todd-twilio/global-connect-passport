# Global Connect Passport

A WhatsApp/SMS-based networking game for global company events, built with Twilio and Airtable.

## What It Does

Guests receive lanyards with unique 4-digit ID codes. They text their code to activate their "passport," then collect stamps by texting codes from people in different countries. When they reach the required number of stamps (default: 10), they unlock access to redeem a prize.

**Key Features:**
- 📱 No app required - works via WhatsApp or SMS
- 🌍 Encourages cross-regional networking
- 🎯 Real-time validation and feedback
- 📊 Live admin dashboard with statistics
- 🎁 Built-in prize redemption tracking

## Demo

```
Guest A (USA): Texts "1234" (their own code)
← "Welcome! Your passport is activated. Collect stamps from 10 people..."

Guest A: Texts "5678" (Guest B's code from Japan)
← "Stamp collected! LinkedIn: linkedin.com/in/guestb"
→ Guest B receives: "Guest A collected your stamp!"

... 9 more stamps later ...

Guest A: Texts "9012" (10th stamp)
← "Congratulations! You've completed your passport! Visit the prize station..."
```

## Architecture

```
┌─────────────┐
│   Guests    │ Send codes via WhatsApp/SMS
│ (WhatsApp/  │────────────────┐
│    SMS)     │                │
└─────────────┘                │
                               ▼
                        ┌──────────────┐
                        │    Twilio    │
                        │    Studio    │ ← Conversation flow
                        │     Flow     │
                        └──────┬───────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
            ┌───────────────┐     ┌──────────────┐
            │    Twilio     │────▶│   Airtable   │
            │   Functions   │     │   Database   │
            │  (Serverless) │     │              │
            └───────┬───────┘     └──────────────┘
                    │
                    ▼
            ┌───────────────┐
            │     Admin     │
            │   Dashboard   │ ← Real-time stats
            └───────────────┘
```

## Quick Start

### Prerequisites

- [Twilio account](https://www.twilio.com/try-twilio) with a WhatsApp-enabled phone number
- [Airtable account](https://airtable.com/signup) (free tier works)
- [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart) installed
- Node.js 18+ installed

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/twilio-samples/global-connect.git
   cd global-connect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Set up Airtable**
   ```bash
   node setup-airtable.js
   ```
   This creates all required tables: Global Countries, Guests, Stamps, GameSettings, ErrorLog

5. **Import country and guest data**
   - First, import country reference data into Global Countries table
     - Use [sample-countries-data.csv](sample-countries-data.csv) or your own
   - Then import your guest list into Guests table
     - Format: Name, Email, Phone, LinkedIn
     - See [sample-guest-data.csv](sample-guest-data.csv) for format
   - Link each guest to their country in the Country field
   
6. **Create initial GameSettings record**
   - Open the GameSettings table in Airtable
   - Create ONE record:
     - Game Number: "1"
     - GameActive: ✓ (checked)
     - Leave other fields empty

7. **Deploy to Twilio**
   ```bash
   twilio serverless:deploy
   ```
   This deploys all Functions and the admin dashboard.

8. **Configure dashboard URLs**
   - Update `assets/admin-dashboard.html` with your deployed URL
   - Update `assets/map-dashboard.html` with your deployed URL
   - See [POST-DEPLOYMENT-CONFIG.md](POST-DEPLOYMENT-CONFIG.md) for details

9. **Re-deploy with updated URLs**
   ```bash
   twilio serverless:deploy --override-existing-project
   ```

10. **Import Studio Flow**
   - Open [Twilio Studio](https://console.twilio.com/us1/develop/studio/flows)
   - Create new flow → Import from JSON
   - Upload the configured `twilio-studio-flow.json`
   - Publish the flow

11. **Configure phone number**
   - In Twilio Console → Phone Numbers → [Your Number]
   - Under "Messaging" → "A message comes in"
   - Select "Studio Flow" → Choose your imported flow
   - Save

### Deployment Guide

For detailed step-by-step instructions, see [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md).

## Project Structure

```
global-connect/
├── functions/              # Twilio Serverless Functions
│   ├── validate-stamp.js   # Core stamp collection logic
│   ├── lookup-guest.js     # Guest data retrieval
│   ├── get-stats.js        # Dashboard statistics
│   ├── mark-redemption.js  # Prize redemption tracking
│   ├── end-game.js         # Game shutdown
│   ├── reset-game.js       # Game reset (use with caution)
│   ├── send-summaries.js   # Post-game summaries
│   ├── delay.js            # Artificial delay helper
│   └── helpers/            # Utility functions
│       ├── country-flags.js    # Country emoji mapping
│       └── country-greetings.js # Multilingual greetings
├── assets/                 # Static files
│   ├── admin-dashboard.html    # Real-time admin interface
│   └── map-dashboard.html      # Connection visualization
├── twilio-studio-flow.json # Studio conversation flow
├── setup-airtable.js       # Airtable schema setup
├── sample-guest-data.csv   # Guest data template
├── .env.example            # Environment variable template
├── ARCHITECTURE.md         # Technical design details
├── DEPLOYMENT-GUIDE.md     # Step-by-step setup
├── airtable-schema.md      # Database schema
└── GAME_MANAGEMENT_SETUP.md # Game operation guide
```

## Features

### For Guests
- ✅ WhatsApp/SMS-based (no app required)
- ✅ Real-time stamp collection
- ✅ Automatic LinkedIn profile sharing
- ✅ Progress tracking (X/10 stamps)
- ✅ Completion notification
- ✅ Personalized greetings in native language

### For Organizers
- ✅ Real-time admin dashboard
- ✅ Leaderboard with tiebreaker logic
- ✅ Recent activity feed
- ✅ Gift redemption tracking
- ✅ Error log monitoring
- ✅ Full game reset capability
- ✅ Connection map visualization

### Smart Validation
- ✅ Country diversity enforcement (no duplicate countries)
- ✅ No self-scanning
- ✅ No duplicate stamps
- ✅ Invalid code detection
- ✅ Rate limiting (message pumping prevention)
- ✅ Channel toggle (enable/disable SMS or WhatsApp)
- ✅ URL detection (for LinkedIn profile submission)

## Configuration

### Environment Variables

See [.env.example](.env.example) for all available settings.

**Key settings:**
- `STAMPS_REQUIRED=10` - Number of stamps needed to complete
- `RATE_LIMIT_SECONDS=3` - Minimum time between messages per user
- `ALLOW_SMS=false` - Enable/disable SMS (WhatsApp only by default)
- `ALLOW_WHATSAPP=true` - Enable/disable WhatsApp

### Game Settings

The `GameSettings` table in Airtable controls:
- Game active/inactive state
- Summary emails sent flag
- Game end timestamp

See [GAME_MANAGEMENT_SETUP.md](GAME_MANAGEMENT_SETUP.md) for operations.

## Admin Dashboard

Access at: `https://YOUR-DOMAIN.twil.io/admin-dashboard.html`

Features:
- Real-time statistics (total guests, stamps, completions)
- Leaderboard (top collectors with tiebreaker logic)
- Recent activity feed
- Pending redemptions
- Error log viewer
- Game on/off toggle

## Testing

### Pre-Event Testing Checklist

- [ ] Guest activation (text own code)
- [ ] Stamp collection (text other's code)
- [ ] Both parties receive messages
- [ ] LinkedIn links appear correctly
- [ ] Country diversity validation works
- [ ] Self-scan rejection
- [ ] Duplicate stamp rejection
- [ ] Invalid code error handling
- [ ] Completion message at required stamps
- [ ] Dashboard loads and updates
- [ ] Gift redemption marking
- [ ] Error logging displays correctly

### Test with Multiple Channels

If using both WhatsApp and SMS:
- [ ] WhatsApp → WhatsApp interaction
- [ ] SMS → SMS interaction
- [ ] WhatsApp → SMS cross-interaction

## Cost Estimate

For 100 guests with 10 messages per guest (activation + stamps + notifications):

- **Twilio WhatsApp**: ~$0.005/message × 1,000 = $5.00
- **Twilio SMS** (if used): ~$0.0075/message × 1,000 = $7.50
- **Twilio Phone Number**: ~$1.00/month
- **Airtable**: Free tier (up to 1,200 records)

**Total: ~$6-8** per event

## Security

- ✅ API keys stored in Twilio environment variables (not in code)
- ✅ All Functions use protected endpoints (require auth)
- ✅ Confirmation code required for game reset
- ✅ Rate limiting prevents message spam
- ✅ Channel controls prevent abuse
- ✅ No sensitive data exposed in client-side code

**Important:** Never commit `.env` file to version control.

## Troubleshooting

### Messages Not Sending

1. Check Twilio Console → Monitor → Logs → Messaging
2. Verify phone numbers are in E.164 format (+15551234567)
3. Check Studio Flow is published and connected to phone number
4. Verify Functions are deployed and accessible

### Stamps Not Recording

1. Check Airtable → Stamps table for new records
2. Review Function logs in Twilio Console
3. Verify Airtable API key has write permissions
4. Check ErrorLog table in Airtable for logged errors

### Dashboard Not Loading

1. Open browser developer console (F12)
2. Verify Functions URL is correct in HTML
3. Ensure `get-stats` Function visibility is "Public"
4. Check CORS headers if loading from different domain

### Debugging Tools

- **Twilio Logs**: Console → Monitor → Logs
- **Function Logs**: Console → Functions → [Service] → Logs
- **Airtable**: Directly inspect tables for data
- **Browser Console**: F12 → Console tab for dashboard errors

## Known Limitations

- SMS functionality implemented but not fully tested at scale
- Maximum 10,000 possible unique 4-digit codes (may need uniqueness strategy for large events)
- Rate limiting is per-user only (no global rate limit)
- LinkedIn profile submission requires manual review

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Areas for contribution:**
- SMS testing and validation
- Multilingual message templates
- Additional country greetings
- Performance optimizations
- Documentation improvements

## Future Enhancements

Potential additions for future versions:
- [ ] Photo upload to event wall
- [ ] Team competitions with group leaderboards
- [ ] Multi-language SMS templates
- [ ] Post-event networking report generation
- [ ] Integration with event management platforms
- [ ] Automated LinkedIn profile validation

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System design and technical details
- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - Complete setup instructions
- [airtable-schema.md](airtable-schema.md) - Database structure
- [GAME_MANAGEMENT_SETUP.md](GAME_MANAGEMENT_SETUP.md) - Game operations
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with:
- [Twilio](https://www.twilio.com/) - Communications platform
- [Airtable](https://airtable.com/) - Database and backend
- [Twilio Studio](https://www.twilio.com/docs/studio) - Conversation flow builder
- [Twilio Serverless](https://www.twilio.com/docs/serverless) - Function hosting

---

**Ready to get started?** Follow the [Quick Start](#quick-start) guide above.

**Questions or issues?** Open an [issue](https://github.com/twilio-samples/global-connect/issues) on GitHub.
