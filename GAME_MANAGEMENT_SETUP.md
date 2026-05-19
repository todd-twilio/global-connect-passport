# Game Management Features - Setup Guide

## Deployed Changes

### New Functions
1. **`/end-game`** - Ends the game by setting GameActive to false
   - URL: https://YOUR-SERVICE-NAME.twil.io/end-game

2. **`/send-summaries`** - Sends summary messages to all activated users
   - URL: https://YOUR-SERVICE-NAME.twil.io/send-summaries

### Updated Functions
1. **`/validate-stamp`** - Now checks if game is active before processing stamps
   - Returns new action `game_ended` when game is inactive

2. **`/get-stats`** - Now includes game settings in response
   - Added `gameSettings` object with game and summary status

### Updated Assets
1. **`admin-dashboard.html`** - Added two new sections:
   - Game Management section with game status and "End Game" button
   - Send User Summaries section with status and "Send User List" button

---

## Required: Airtable Setup

### Create GameSettings Table

You need to create a new table in Airtable called **`GameSettings`** with the following fields:

1. **GameActive** (Checkbox)
   - Default: Checked ✓
   - This controls whether the game is active

2. **GameEndedAt** (Date & Time)
   - When the game was ended

3. **SummariesSent** (Checkbox)
   - Whether summary messages have been sent

4. **SummariesSentAt** (Date & Time)
   - When summaries were sent

**IMPORTANT:** Create **exactly ONE record** in this table with `GameActive` checked.

### Steps to Create:
1. Go to your Airtable base
2. Create new table: "GameSettings"
3. Add the four fields above
4. Create one record with GameActive = checked
5. Done!

---

## Required: Studio Flow Update

The `/validate-stamp` function now returns a new action type when the game has ended. You need to update your Studio Flow to handle this:

### New Action Type: `game_ended`

When the game is ended, validate-stamp returns:
```json
{
  "success": true,
  "action": "game_ended",
  "message": "Thank you for playing Twilio Global Connect! Enjoy the rest of the event."
}
```

### Studio Flow Changes Needed:

Add a new branch in your Studio Flow that checks for `action = "game_ended"` and sends the message back to the user.

Example Flow Logic:
```
Split based on validate-stamp response:
  - If action = "game_ended":
    → Send Message: {{widgets.validate_stamp.parsed.message}}
  - If action = "activate":
    → [existing activation flow]
  - If action = "stamp_collected":
    → [existing stamp collection flow]
  - etc.
```

---

## Required: Configure Messaging

The `/send-summaries` function needs to send messages via Twilio. You need to configure the sending phone number or messaging service.

### Option 1: Using a Phone Number
Update line 52 in `/functions/send-summaries.js`:
```javascript
from: '+15551234567' // Your Twilio phone number
```

### Option 2: Using a Messaging Service (Recommended)
Update line 52 in `/functions/send-summaries.js`:
```javascript
from: 'MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // Your Messaging Service SID
```

Then redeploy:
```bash
# Ensure your .env file has the required credentials, then deploy:
twilio serverless:deploy --override-existing-project
```

---

## Testing

### Test Game End Feature:
1. Open admin dashboard: https://YOUR-SERVICE-NAME.twil.io/admin-dashboard.html
2. Click "End Game" button
3. Confirm the action
4. Try sending a stamp code via SMS - should get the game ended message

### Test Send Summaries Feature:
1. Make sure at least one user has collected stamps
2. Click "Send User List" button
3. Confirm the action
4. Messages will be sent to all activated users with their collected stamps

---

## Features

### Game Management Section
- Shows current game status (Active/Ended)
- "End Game" button - ends the game for all users
  - Disabled after game is ended
  - Shows confirmation dialog before ending

### Send User Summaries Section
- Shows if summaries have been sent
- "Send User List" button - sends summary to all activated users
  - Only works once (disabled after first send)
  - Shows progress while sending
  - Displays results: # sent, # failed
  - View failed messages with error details

### Summary Message Format
```
Here's everyone you met today:

NAMER
Todd Andersen 🇺🇸
Jim Bob 🇺🇸

EMEA
Sarah Johnson 🇬🇧
Klaus Schmidt 🇩🇪
```

Messages are grouped by region, sorted by most contacts first, using country flag emojis.

---

## Notes

- Summary messages respect each user's `Preferred_Channel` (SMS vs WhatsApp)
- Only activated users with stamps will receive summaries
- Error handling shows which users failed and why
- Game end is immediate and irreversible (unless you manually change Airtable)
- All changes have been deployed to: https://YOUR-SERVICE-NAME.twil.io
