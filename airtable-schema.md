# Airtable Database Schema

This document describes the complete Airtable schema for the Global Connect Passport game.

## Overview

The database consists of 4 tables:
1. **Guests** - Participant information and game state
2. **Stamps** - Record of stamp collections between guests
3. **Global Countries** - Reference table for country data
4. **GameSettings** - Controls game active state and summary status

---

## Table 1: Guests

Stores all participant information, game progress, and computed fields.

### Fields

#### Identity & Contact
| Field | Type | Description |
|-------|------|-------------|
| `Name` | Single line text | Guest's full name |
| `Email` | Email | Guest's email address |
| `Phone` | Phone number | Mobile number in E.164 format (e.g., +14155551234) |
| `Phone_formatted` | Formula | Auto-formatted phone number (strips non-digits, ensures + prefix) |
| `ID_Code` | Formula | Last 4 digits of formatted phone number (used as game ID) |

#### Location
| Field | Type | Description |
|-------|------|-------------|
| `Country` | Link to Global Countries | Guest's home country (single record link) |
| `Country (abv)` | Lookup | Country abbreviation (Alpha 2 code) from linked country |
| `Regions (from Country)` | Lookup | Geographic region (APAC/EMEA/NAMER/LATAM/WW) |
| `Primary Languages (abr)` | Rollup | ISO language codes from country |

#### Social
| Field | Type | Description |
|-------|------|-------------|
| `LinkedIn` | URL | LinkedIn profile URL (manually entered) |
| `LinkedIn_URL_Finder` | AI Text | AI-generated LinkedIn URL based on name, email, country |
| `Career Summary` | AI Text | AI-generated career summary (max 50 words) from LinkedIn profile |

#### Game State
| Field | Type | Description |
|-------|------|-------------|
| `Activated` | Checkbox | Whether guest has activated their account (sent their ID code) |
| `Preferred_Channel` | Single select | Communication channel: `sms` or `whatsapp` |
| `Gift_Redeemed` | Checkbox | Whether guest has redeemed their completion gift |
| `Form_submitted` | Checkbox | Whether guest submitted initial form |
| `Last_Message_Time` | Date & Time | Timestamp of last message sent (used for rate limiting) |

#### Stamps
| Field | Type | Description |
|-------|------|-------------|
| `Stamps_Collected` | Link to Stamps | Stamps this guest has collected (multiple) |
| `Stamp_Count` | Count | Number of stamps collected (auto-computed) |
| `Stamps` | Link to Stamps | Stamps where this guest was scanned (reverse link) |

#### AI-Generated Greetings
| Field | Type | Description |
|-------|------|-------------|
| `Personalized Greeting` | AI Text | Greeting in guest's native language using their name |
| `Stamps Greeting intro` | AI Text | Intro text for greeting in native language: "Greet your new contact in their native language:" |
| `Stamps Greeting` | AI Text | Informal greeting for first-time meeting in native language |

### Key Formulas

**Phone_formatted:**
```
IF(
  {Phone},
  IF(
    FIND("+", {Phone}),
    CONCATENATE("+", REGEX_REPLACE(REGEX_REPLACE({Phone}, "^\\+", ""), "[^0-9]", "")),
    CONCATENATE("+1", REGEX_REPLACE({Phone}, "[^0-9]", ""))
  ),
  ""
)
```

**ID_Code:**
```
RIGHT({Phone_formatted}, 4)
```

---

## Table 2: Stamps

Records each stamp collection transaction.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `Collected_Code` | Single line text | The 4-digit ID code that was scanned (primary field) |
| `Timestamp` | Created time | When the stamp was collected (auto-generated) |
| `Collector` | Link to Guests | The guest who collected this stamp (single record) |
| `Collected_Guest_Record` | Link to Guests | The guest whose code was scanned (single record) |
| `Collected_Guest` | Lookup | Name of collector from Collector link |
| `Collected_Country` | Lookup | Country of collector from Collector link |
| `Name (from Collected_Guest_Record)` | Lookup | Name of person who was scanned |
| `Country (from Collected_Guest_Record)` | Lookup | Country of person who was scanned |

### Relationships

- **Collector** → Links to Guests.Stamps_Collected (one-to-many)
- **Collected_Guest_Record** → Links to Guests.Stamps (one-to-many)

### Business Rules (Enforced in Code)

1. ✅ A collector can collect each person's code only once (no duplicates)
2. ❌ ~~Cannot collect from same country~~ (removed)
3. ✅ Must be activated before collecting stamps
4. ✅ Game must be active to collect stamps
5. ✅ Channel restrictions enforced (SMS/WhatsApp can be individually disabled)
6. ✅ Rate limiting: Max 1 message per 3 seconds per user (configurable)

---

## Table 3: Global Countries

Reference table containing all countries and their attributes.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `Country` | Single line text | Full country name (primary field) |
| `Alpha 2 Code` | Single line text | ISO 3166-1 alpha-2 country code (e.g., "US", "GB") |
| `Regions` | Single select | Geographic region: APAC, EMEA, NAMER, LATAM, WW |
| `Sub Region` | Single select | Sub-region: ANZ, BRAZIL, CANADA, DACH, FRANCE, JAPAN, NORTH, ROA, ROE, ROL, USA |
| `SFDC Region Object` | Single select | Salesforce region mapping: APAC, NA, EMEA, LATAM, WW |
| `Primary Languages` | Single line text | Human-readable language names (e.g., "English, Spanish") |
| `ISO Languages` | Single line text | ISO 639-1 language codes (e.g., "en, es") |
| `Last Modified` | Date & time | Last time country record was updated |
| `Guests` | Link to Guests | All guests from this country (reverse link) |

### Purpose

- Provides country data for guest records
- Enables regional grouping and filtering
- Supplies language information for AI-generated greetings
- Used for stamp collection validation (removed country diversity rule)

---

## Table 4: GameSettings

Controls the game state and summary sending status. **Should contain exactly ONE record.**

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `Game Number` | Single line text | Identifier for this game instance (primary field) |
| `GameActive` | Checkbox | Whether the game is currently active (accepting stamps) |
| `GameEndedAt` | Date & time | Timestamp when game was ended (null if active) |
| `SummariesSent` | Checkbox | Whether end-of-game summaries have been sent |
| `SummariesSentAt` | Date & time | Timestamp when summaries were sent |

### Usage

- **Game Active**: When checked, players can collect stamps. When unchecked, validate-stamp returns "game_ended" action.
- **End Game**: Admin dashboard sets `GameActive = false` and records `GameEndedAt`
- **Activate Game**: Admin dashboard sets `GameActive = true` and clears `GameEndedAt`
- **Send Summaries**: Admin dashboard triggers message sending, then sets `SummariesSent = true` and records `SummariesSentAt`

### Initial Setup

Create one record:
- Game Number: "1" (or any identifier)
- GameActive: ✓ (checked)
- All other fields: empty

---

## Relationships Diagram

```
┌─────────────────┐
│ Global Countries│
│  - Country      │
│  - Alpha 2 Code │
│  - Regions      │
└────────┬────────┘
         │
         │ (linked to)
         ↓
    ┌────────┐
    │ Guests │
    │  - Name│
    │  - ID  │
    └───┬────┘
        │
        ├─ (collects) ──→ ┌────────┐
        │                  │ Stamps │
        │                  └────────┘
        └─ (scanned by) ←──┘
```

---

## Field Naming Conventions

- **Linked Records**: PascalCase with underscores (e.g., `Stamps_Collected`)
- **Lookups**: Sentence case with parentheses (e.g., `Country (abv)`)
- **Formulas**: Snake_case (e.g., `Phone_formatted`, `ID_Code`)
- **Regular fields**: PascalCase (e.g., `Name`, `Email`)
- **Checkboxes**: PascalCase with underscore (e.g., `Gift_Redeemed`)

---

## Important Notes

### AI Fields
The schema includes several AI-generated fields that use Airtable's AI feature. These are optional but enhance the user experience:
- LinkedIn URL finding
- Personalized greetings in native languages
- Career summaries

If AI features are unavailable, these can be:
- Left empty
- Manually populated
- Removed (adjust code to not reference them)

### Phone Number Format
All phone numbers **must** be in E.164 format (+[country code][number]) for SMS/WhatsApp delivery to work correctly.

Example: `+14155551234` (USA), `+442071234567` (UK)

### Country Data
The Global Countries table should be pre-populated with all countries your guests might represent. This ensures proper region grouping and language detection for AI greetings.

---

## Migration from Old Schema

If upgrading from an earlier version:

1. **Add GameSettings table** with the fields above
2. **Add Preferred_Channel field** to Guests table (single select: sms/whatsapp)
3. **Update Stamps table** to include `Collected_Guest_Record` link if missing
4. Verify all lookups are properly configured

---

## Sample Data CSV Format

For importing initial guest data:

```csv
Name,Phone,Email,LinkedIn
Sarah Johnson,+442071234567,sarah.johnson@example.com,https://linkedin.com/in/sarahjohnson
Marco Silva,+5511987654321,marco.silva@example.com,https://linkedin.com/in/marcosilva
Yuki Tanaka,+819012345678,yuki.tanaka@example.com,
Emma Schmidt,+4915123456789,emma.schmidt@example.com,https://linkedin.com/in/emmaschm
```

**Note**: 
- Phone numbers must be in E.164 format
- ID_Code will be auto-generated from phone number
- Country should be linked after import (or use Airtable's linked record import format)
