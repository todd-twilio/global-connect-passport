# Global Connect Passport - Technical Architecture

## System Overview
SMS-based networking game using Twilio Studio + Functions + Airtable

## Component Architecture

### 1. Airtable Database Schema

**Table: Guests**
- `ID_Code` (Number, Primary): Unique 4-digit badge code (e.g., 1574)
- `Name` (Text): Guest full name
- `Phone` (Phone): E.164 format (e.g., +15551234567)
- `Country` (Text): Guest's country for region validation
- `LinkedIn` (URL): Optional LinkedIn profile URL
- `Stamps_Collected` (Multiple Record Links → Stamps): Links to collected stamps
- `Stamp_Count` (Formula): `LEN({Stamps_Collected})`
- `Gift_Redeemed` (Checkbox): Marked by attendant when gift claimed
- `Activated` (Checkbox): True when user texts their code to activate

**Table: Stamps**
- `Stamp_ID` (Auto Number, Primary)
- `Collector` (Link to Guests): Who collected this stamp
- `Collected_Code` (Number): The badge code they scanned
- `Collected_Guest` (Lookup): Name of person whose code was scanned
- `Collected_Country` (Lookup): Country of person whose code was scanned
- `Timestamp` (Created Time): When stamp was collected

### 2. Twilio Studio Flow

**Flow Name**: Global-Connect-Passport

**Triggers**: Incoming SMS

**Flow Logic**:
1. **Parse Message** → Extract incoming text
2. **Lookup Sender** → Twilio Function: `lookupGuest(from_phone)`
3. **Branch**: First time user?
   - If YES (texting their own code) → Activate account
   - If NO → Process stamp collection
4. **Validate Code** → Twilio Function: `validateStamp(collector_id, target_code)`
5. **Send Response** → Dynamic messaging based on validation result
6. **Check Milestone** → If stamp_count == 5, send completion message

### 3. Twilio Functions

**Function: /lookup-guest**
- Input: `phone_number`
- Output: Guest record or null
- Logic: Query Airtable for guest by phone

**Function: /validate-stamp**
- Input: `collector_phone`, `target_code`
- Output: Validation result + guest data
- Logic:
  - Lookup collector by phone
  - Lookup target guest by code
  - Check: Code exists?
  - Check: Self-scan?
  - Check: Duplicate stamp?
  - Check: Different country? (for uniqueness)
  - Create stamp record in Airtable
  - Return both guest records for messaging

**Function: /get-stats**
- Input: None (or optional filters)
- Output: Real-time game statistics
- Logic: Query Airtable for dashboard data

**Function: /reset-game**
- Input: Optional guest_id (full reset or single user)
- Output: Success confirmation
- Logic: Delete all stamps, reset activation flags

### 4. Admin Dashboard

**Simple HTML/JS Dashboard** (hosted on Twilio Functions or separate)

**Features**:
- Real-time stats:
  - Total guests activated
  - Total stamps collected
  - Guests who completed (5+ stamps)
  - Recent stamp activity (live feed)
- Reset buttons:
  - Full game reset
  - Individual guest reset
- Gift redemption view:
  - List of completed guests
  - Checkbox to mark gift as redeemed

## Message Templates

### Activation (First Text)
```
Welcome, [Name]! Your passport is active. Meet 5 people from different countries to unlock your 'Global Artist' tile and a gift. Just text their 4-digit badge codes to me!
```

### Stamp Collected (To Collector)
```
Stamp Collected! [Flag] You just met [Name] ([Country]). [LinkedIn: Link] ([X]/5 Stamps Collected)
```

### Stamp Collected (To Scanned)
```
Your code was just collected by [Name] ([Country])! [Flag] [LinkedIn: Link]
```

### Completion (5th Stamp)
```
Passport Validated! You've traveled the world tonight. Head to the Global Art Wall, grab a tile for your industry basket, add your company name and country using the markers and add your mark to our collective masterpiece. Show this text to the attendant for your gift!
```

### Error Messages
- Invalid code: `Sorry, that code doesn't exist. Please try again.`
- Self-scan: `Sorry, you cannot enter your own number. Try again.`
- Duplicate: `You've already collected this stamp. Try someone new!`
- Same country: `You've already met someone from [Country]. Try collecting from a different country!`

## Country Flag Emojis
Map countries to flag emojis in Twilio Function for visual appeal.

## Security Considerations
- Rate limiting on Twilio Functions
- Validate all Airtable queries
- Sanitize user inputs
- Secure Airtable API key in Twilio environment variables

## Deployment Checklist
1. Create Airtable base with schema
2. Import guest data CSV
3. Deploy Twilio Functions
4. Build Twilio Studio flow
5. Test end-to-end with test phone numbers
6. Deploy admin dashboard
7. Print event signage with Twilio number
