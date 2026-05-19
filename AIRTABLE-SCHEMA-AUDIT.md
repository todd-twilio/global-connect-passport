# Airtable Schema Audit Report

**Date:** 2026-05-19  
**Status:** ❌ DISCREPANCIES FOUND

---

## Executive Summary

The Airtable schema has **7 critical discrepancies** between the setup script (`setup-airtable.js`), documentation (`airtable-schema.md`), and actual code usage. The current setup script will NOT create a fully functional database.

### Severity Breakdown
- 🔴 **CRITICAL (5 issues)**: App will fail without these
- 🟡 **HIGH (4 issues)**: Required for full functionality  
- 🟢 **MEDIUM (3 issues)**: Optional enhancements

---

## Critical Issues (App Will Fail)

### 🔴 Issue #1: ErrorLog Table Missing
**Problem:** Table used extensively but never created by setup script

**Impact:** Error logging will fail in production

**Used in:**
- `validate-stamp.js` - Writes errors
- `get-stats.js` - Displays errors in admin dashboard
- `reset-game.js` - Deletes error log

**Required Fields:**
```javascript
{
  name: 'ErrorLog',
  fields: [
    { name: 'Phone', type: 'phoneNumber' },
    { name: 'Guest_Name', type: 'singleLineText' },
    { name: 'Error_Type', type: 'singleSelect', options: { choices: [
      { name: 'INVALID_CODE' },
      { name: 'ALREADY_COLLECTED' },
      { name: 'SELF_SCAN' },
      { name: 'NOT_ACTIVATED' },
      { name: 'RATE_LIMIT' },
      { name: 'CHANNEL_BLOCKED' },
      { name: 'SYSTEM_ERROR' }
    ]}},
    { name: 'Error_Message', type: 'multilineText' },
    { name: 'Timestamp', type: 'dateTime' }
  ]
}
```

---

### 🔴 Issue #2: GameSettings Table Missing
**Problem:** Table documented but not created by setup script

**Impact:** Game control features (end game, send summaries) won't work

**Documented:** `airtable-schema.md` lines 151-178

**Used in:**
- `validate-stamp.js` - Checks if game is active
- `get-stats.js` - Displays game status
- `send-summaries.js` - Tracks if summaries sent
- `end-game.js` - Sets game inactive
- `reset-game.js` - Resets game state

**Required Fields:**
```javascript
{
  name: 'GameSettings',
  fields: [
    { name: 'Game Number', type: 'singleLineText' }, // Primary field
    { name: 'GameActive', type: 'checkbox' },
    { name: 'GameEndedAt', type: 'dateTime' },
    { name: 'SummariesSent', type: 'checkbox' },
    { name: 'SummariesSentAt', type: 'dateTime' }
  ]
}
```

**Initial Record Required:**
```javascript
{
  'Game Number': '1',
  'GameActive': true
}
```

---

### 🔴 Issue #3: Global Countries Table Missing
**Problem:** Referenced extensively via lookups but never created

**Impact:** Country lookups will fail, regional grouping won't work

**Documented:** `airtable-schema.md` lines 123-147

**Used via lookups in:**
- `send-summaries.js` - Groups guests by region
- `get-stats.js` - Displays countries in leaderboard
- `validate-stamp.js` - Uses country abbreviations

**Required Fields:**
```javascript
{
  name: 'Global Countries',
  fields: [
    { name: 'Country', type: 'singleLineText' }, // Primary field
    { name: 'Alpha 2 Code', type: 'singleLineText' }, // US, GB, JP, etc.
    { name: 'Regions', type: 'singleSelect', options: { choices: [
      { name: 'APAC' },
      { name: 'EMEA' },
      { name: 'NAMER' },
      { name: 'LATAM' },
      { name: 'WW' }
    ]}},
    { name: 'Sub Region', type: 'singleSelect' },
    { name: 'ISO Languages', type: 'singleLineText' } // e.g., "en, es"
  ]
}
```

**Note:** Needs to be populated with country data before guests can be imported.

---

### 🔴 Issue #4: ID_Code Field Type Wrong
**Problem:** Created as `number` but should be `formula`

**Impact:** ID codes won't auto-generate from phone numbers

**Current (setup-airtable.js line 78):**
```javascript
{ name: 'ID_Code', type: 'number', options: { precision: 0 } }
```

**Should Be:**
```javascript
{ name: 'ID_Code', type: 'formula', options: { formula: 'RIGHT({Phone_formatted}, 4)' } }
```

**Dependency:** Requires `Phone_formatted` formula field to exist first

---

### 🔴 Issue #5: Stamps.Collected_Guest_Record Link Missing
**Problem:** Second relationship to Guests table not created

**Impact:** Can't track who was scanned (only who scanned them)

**Used in:**
- `validate-stamp.js` line 442 - Creates stamp with both Collector and Collected_Guest_Record
- `send-summaries.js` - Retrieves who each person met
- `get-stats.js` - Displays connection map data

**Required:**
```javascript
// After creating Collector link, add:
{
  name: 'Collected_Guest_Record',
  type: 'multipleRecordLinks',
  options: {
    linkedTableId: guestsTableId,
    prefersSingleRecordLink: true
  }
}
```

**This creates TWO relationships:**
- `Collector` → Who collected this stamp (scanner)
- `Collected_Guest_Record` → Whose code was collected (scanned person)

---

## High Priority Issues (Required for Full Functionality)

### 🟡 Issue #6: Missing Guests Fields

**Problem:** Setup script creates only 7 fields, but code uses 27+

**Fields Used But Not Created:**
```javascript
// Identity & Contact
{ name: 'Email', type: 'email' },
{ name: 'Phone_formatted', type: 'formula', options: {
  formula: 'IF({Phone}, IF(FIND("+", {Phone}), CONCATENATE("+", REGEX_REPLACE(REGEX_REPLACE({Phone}, "^\\+", ""), "[^0-9]", "")), CONCATENATE("+1", REGEX_REPLACE({Phone}, "[^0-9]", ""))), "")'
}},

// Game State
{ name: 'Preferred_Channel', type: 'singleSelect', options: { choices: [
  { name: 'sms' },
  { name: 'whatsapp' }
]}},
{ name: 'Last_Message_Time', type: 'dateTime' },
{ name: 'Form_submitted', type: 'checkbox' }
```

**Used in:**
- `validate-stamp.js` - Checks Last_Message_Time for rate limiting, uses Preferred_Channel
- `send-summaries.js` - Uses Preferred_Channel to choose SMS vs WhatsApp
- `lookup-guest.js` - Returns Email in guest data

---

### 🟡 Issue #7: Country Field Type Mismatch

**Problem:** Country created as text, should be linked record

**Current (setup-airtable.js line 93):**
```javascript
{ name: 'Country', type: 'singleLineText' }
```

**Should Be:**
```javascript
{
  name: 'Country',
  type: 'multipleRecordLinks',
  options: {
    linkedTableId: globalCountriesTableId,
    prefersSingleRecordLink: true
  }
}
```

**Then Add Lookups:**
```javascript
{ name: 'Country (abv)', type: 'multipleLookupValues', options: {
  recordLinkFieldId: countryFieldId,
  fieldIdInLinkedTable: alpha2CodeFieldId
}},
{ name: 'Regions (from Country)', type: 'multipleLookupValues', options: {
  recordLinkFieldId: countryFieldId,
  fieldIdInLinkedTable: regionsFieldId
}}
```

---

### 🟡 Issue #8: Missing Stamps Lookups

**Problem:** Setup creates lookups from Collector, but not from Collected_Guest_Record

**Currently Creates:**
- `Collected_Guest` - Lookup of name from Collector
- `Collected_Country` - Lookup of country from Collector

**Also Needs:**
- `Name (from Collected_Guest_Record)` - Name of person who was scanned
- `Country (from Collected_Guest_Record)` - Country of person who was scanned

**Used in:**
- Admin dashboard displays to show "X collected stamp from Y"

---

### 🟡 Issue #9: Stamp_Count Field Wrong

**Problem:** Created as formula `LEN({Stamps_Collected})` but LEN doesn't work on links

**Current (setup-airtable.js line 193):**
```javascript
{ name: 'Stamp_Count', type: 'formula', options: { formula: 'LEN({Stamps_Collected})' } }
```

**Should Be:**
```javascript
{ name: 'Stamp_Count', type: 'count', options: { recordLinkFieldId: stampsCollectedFieldId } }
```

Or use formula: `COUNTA({Stamps_Collected})`

---

## Medium Priority Issues (Optional)

### 🟢 Issue #10: AI Fields Not Created

**Problem:** Schema documents AI fields but setup doesn't create them

**AI Fields in Schema:**
- `LinkedIn_URL_Finder` - AI Text
- `Career Summary` - AI Text
- `Personalized Greeting` - AI Text
- `Stamps Greeting intro` - AI Text
- `Stamps Greeting` - AI Text
- `Primary Languages (abr)` - Rollup

**Used in:**
- `validate-stamp.js` - Uses AI greetings if available
- `lookup-guest.js` - Uses LinkedIn_URL_Finder

**Note:** These require Airtable AI features (paid plan). Code has fallbacks if missing.

---

### 🟢 Issue #11: Field Name Mismatch in lookup-guest.js

**Problem:** Code references `LinkedIn_modified` but schema says `LinkedIn_URL_Finder`

**Location:** `lookup-guest.js` line 58

**Options:**
1. Change code to use `LinkedIn_URL_Finder` (if AI field exists)
2. Change code to use `LinkedIn` (standard URL field)
3. Add `LinkedIn_modified` field to schema

**Recommended:** Use `LinkedIn` field as fallback, `LinkedIn_URL_Finder` if available

---

### 🟢 Issue #12: Setup Script Doesn't Handle Updates

**Problem:** Script fails if tables already exist

**Impact:** Can't re-run setup to add missing fields

**Recommendation:** Add update capability:
```javascript
// Check if table exists first
const existingTables = await apiRequest('GET', '/tables');
const guestsTable = existingTables.tables.find(t => t.name === 'Guests');

if (guestsTable) {
  console.log('Guests table exists, adding missing fields...');
  // Add only missing fields
} else {
  console.log('Creating Guests table...');
  // Create table
}
```

---

## Recommended Action Plan

### Phase 1: Fix Critical Issues (Required)
1. Update `setup-airtable.js` to create ErrorLog table
2. Update `setup-airtable.js` to create GameSettings table with initial record
3. Update `setup-airtable.js` to create Global Countries table
4. Update `setup-airtable.js` to create Collected_Guest_Record link in Stamps
5. Fix ID_Code to be formula instead of number
6. Add missing Guests fields: Email, Phone_formatted, Preferred_Channel, Last_Message_Time

### Phase 2: Update Documentation (Required)
7. Update `airtable-schema.md` to clearly mark required vs optional fields
8. Add note about AI fields requiring paid Airtable plan
9. Document manual steps if any fields can't be created via API

### Phase 3: Fix Code Issues (Required)
10. Fix `lookup-guest.js` line 58 field name reference
11. Update `setup-airtable.js` to handle re-running (add missing fields to existing tables)

### Phase 4: Testing (Required)
12. Test setup script on fresh Airtable base
13. Verify all functions work with created schema
14. Test admin dashboard with all features

---

## Files Requiring Updates

1. **`setup-airtable.js`** - Add 3 missing tables, fix field types, add missing fields
2. **`airtable-schema.md`** - Clarify required vs optional fields
3. **`functions/lookup-guest.js`** - Fix field name on line 58
4. **`README.md`** - Update setup instructions to mention country data import

---

## Testing Checklist

After fixing setup script, verify:

- [ ] ErrorLog table created with all fields
- [ ] GameSettings table created with initial record (GameActive = true)
- [ ] Global Countries table created (can import sample country data)
- [ ] Guests table has Email, Phone_formatted, Preferred_Channel, Last_Message_Time
- [ ] Guests.Country links to Global Countries (not text)
- [ ] Guests.ID_Code is formula, auto-generates from phone
- [ ] Stamps table has both Collector and Collected_Guest_Record links
- [ ] Stamp_Count field uses COUNT not LEN
- [ ] All lookups are properly configured
- [ ] Can import guest CSV successfully
- [ ] Can activate guest and collect stamps
- [ ] Error logging works
- [ ] Admin dashboard loads without errors
- [ ] Game end/start functions work
- [ ] Send summaries works

---

## Priority for GitHub Push

**RECOMMENDED:** Fix these issues **before** pushing to GitHub:

**Critical for users:**
- Add ErrorLog, GameSettings, Global Countries tables to setup script
- Fix ID_Code field type
- Add Collected_Guest_Record link

**Can be documented as "manual steps":**
- AI fields (require paid plan, can document as optional)
- Country data import (can provide CSV sample)

**Add to README:**
```markdown
### Post-Setup Manual Steps

After running `node setup-airtable.js`, you may need to:

1. **Import Country Data** - Download country reference CSV and import to Global Countries table
2. **Link Guest Countries** - If you imported guests before countries, link them manually
3. **Optional: Configure AI Fields** - If you have Airtable AI, add the AI-generated fields for enhanced greetings
```

---

**Status:** Ready for remediation  
**Next Step:** Update `setup-airtable.js` with missing tables and fields
