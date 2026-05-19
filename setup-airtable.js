/**
 * Airtable Setup Script for Global Connect Passport
 *
 * This script creates the complete Airtable schema:
 * - Guests table with all fields
 * - Stamps table with all fields
 * - Relationships between tables
 *
 * Usage:
 *   node setup-airtable.js <AIRTABLE_API_KEY> <BASE_ID>
 *
 * Or set environment variables:
 *   export AIRTABLE_API_KEY=your_key
 *   export AIRTABLE_BASE_ID=your_base_id
 *   node setup-airtable.js
 */

const https = require('https');

// Get credentials from args or environment
const API_KEY = process.argv[2] || process.env.AIRTABLE_API_KEY;
const BASE_ID = process.argv[3] || process.env.AIRTABLE_BASE_ID;

if (!API_KEY || !BASE_ID) {
  console.error('❌ Missing required parameters!');
  console.error('\nUsage:');
  console.error('  node setup-airtable.js <AIRTABLE_API_KEY> <BASE_ID>');
  console.error('\nOr set environment variables:');
  console.error('  export AIRTABLE_API_KEY=your_key');
  console.error('  export AIRTABLE_BASE_ID=your_base_id');
  process.exit(1);
}

console.log('🚀 Starting Airtable setup for Global Connect Passport...\n');
console.log(`Base ID: ${BASE_ID}\n`);

// Helper function to make API requests
function apiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.airtable.com',
      path: `/v0/meta/bases/${BASE_ID}${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body || '{}'));
        } else {
          reject(new Error(`API Error ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Create tables and fields
async function setupAirtable() {
  try {
    // Step 1: Create Global Countries table (reference table)
    console.log('📋 Creating Global Countries table...');
    const countriesTable = await apiRequest('POST', '/tables', {
      name: 'Global Countries',
      description: 'Reference table for countries and regions',
      fields: [
        {
          name: 'Country',
          type: 'singleLineText'
        },
        {
          name: 'Alpha 2 Code',
          type: 'singleLineText'
        },
        {
          name: 'Regions',
          type: 'singleSelect',
          options: {
            choices: [
              { name: 'APAC' },
              { name: 'EMEA' },
              { name: 'NAMER' },
              { name: 'LATAM' },
              { name: 'WW' }
            ]
          }
        },
        {
          name: 'ISO Languages',
          type: 'singleLineText'
        }
      ]
    });
    console.log('✅ Global Countries table created!');
    const countriesTableId = countriesTable.id;

    // Step 2: Create Guests table
    console.log('\n📋 Creating Guests table...');
    const guestsTable = await apiRequest('POST', '/tables', {
      name: 'Guests',
      description: 'Guest information and passport status',
      fields: [
        {
          name: 'Name',
          type: 'singleLineText'
        },
        {
          name: 'Email',
          type: 'email'
        },
        {
          name: 'Phone',
          type: 'phoneNumber'
        },
        {
          name: 'LinkedIn',
          type: 'url'
        },
        {
          name: 'Activated',
          type: 'checkbox',
          options: {
            icon: 'check',
            color: 'greenBright'
          }
        },
        {
          name: 'Gift_Redeemed',
          type: 'checkbox',
          options: {
            icon: 'gift',
            color: 'purpleBright'
          }
        },
        {
          name: 'Form_submitted',
          type: 'checkbox'
        },
        {
          name: 'Preferred_Channel',
          type: 'singleSelect',
          options: {
            choices: [
              { name: 'sms' },
              { name: 'whatsapp' }
            ]
          }
        },
        {
          name: 'Last_Message_Time',
          type: 'dateTime',
          options: {
            dateFormat: {
              name: 'us',
              format: 'M/D/YYYY'
            },
            timeFormat: {
              name: '12hour',
              format: 'h:mma'
            },
            timeZone: 'client'
          }
        }
      ]
    });
    console.log('✅ Guests table created!');
    const guestsTableId = guestsTable.id;

    // Step 2a: Add Phone_formatted formula field
    console.log('🔢 Creating Phone_formatted formula...');
    await apiRequest('POST', `/tables/${guestsTableId}/fields`, {
      name: 'Phone_formatted',
      type: 'formula',
      options: {
        formula: 'IF({Phone}, IF(FIND("+", {Phone}), CONCATENATE("+", REGEX_REPLACE(REGEX_REPLACE({Phone}, "^\\\\+", ""), "[^0-9]", "")), CONCATENATE("+1", REGEX_REPLACE({Phone}, "[^0-9]", ""))), "")'
      }
    });
    console.log('✅ Phone_formatted formula created!');

    // Step 2b: Add ID_Code formula field (depends on Phone_formatted)
    console.log('🔢 Creating ID_Code formula...');
    await apiRequest('POST', `/tables/${guestsTableId}/fields`, {
      name: 'ID_Code',
      type: 'formula',
      options: {
        formula: 'RIGHT({Phone_formatted}, 4)'
      }
    });
    console.log('✅ ID_Code formula created!');

    // Step 2c: Link Guests to Global Countries
    console.log('🔗 Creating Country link field...');
    await apiRequest('POST', `/tables/${guestsTableId}/fields`, {
      name: 'Country',
      type: 'multipleRecordLinks',
      options: {
        linkedTableId: countriesTableId,
        prefersSingleRecordLink: true
      }
    });
    console.log('✅ Country link created!');

    // Step 2d: Add Country lookups (need to get field IDs first)
    console.log('🔍 Creating Country lookup fields...');
    const guestsFields = await apiRequest('GET', `/tables/${guestsTableId}/fields`);
    const countryLinkField = guestsFields.fields.find(f => f.name === 'Country');

    // Get country table fields
    const countriesFields = await apiRequest('GET', `/tables/${countriesTableId}/fields`);
    const alpha2Field = countriesFields.fields.find(f => f.name === 'Alpha 2 Code');
    const regionsField = countriesFields.fields.find(f => f.name === 'Regions');

    // Add Country (abv) lookup
    await apiRequest('POST', `/tables/${guestsTableId}/fields`, {
      name: 'Country (abv)',
      type: 'multipleLookupValues',
      options: {
        recordLinkFieldId: countryLinkField.id,
        fieldIdInLinkedTable: alpha2Field.id
      }
    });
    console.log('✅ Country (abv) lookup created!');

    // Add Regions lookup
    await apiRequest('POST', `/tables/${guestsTableId}/fields`, {
      name: 'Regions (from Country)',
      type: 'multipleLookupValues',
      options: {
        recordLinkFieldId: countryLinkField.id,
        fieldIdInLinkedTable: regionsField.id
      }
    });
    console.log('✅ Regions (from Country) lookup created!');

    // Step 3: Create Stamps table
    console.log('\n📋 Creating Stamps table...');
    const stampsTable = await apiRequest('POST', '/tables', {
      name: 'Stamps',
      description: 'Stamp collection records',
      fields: [
        {
          name: 'Collected_Code',
          type: 'singleLineText'
        },
        {
          name: 'Timestamp',
          type: 'dateTime',
          options: {
            dateFormat: {
              name: 'us',
              format: 'M/D/YYYY'
            },
            timeFormat: {
              name: '12hour',
              format: 'h:mma'
            },
            timeZone: 'client'
          }
        }
      ]
    });
    console.log('✅ Stamps table created!');
    const stampsTableId = stampsTable.id;

    // Step 4: Add linked record field from Stamps to Guests (Collector)
    console.log('\n🔗 Creating Collector link field in Stamps...');
    await apiRequest('POST', `/tables/${stampsTableId}/fields`, {
      name: 'Collector',
      type: 'multipleRecordLinks',
      options: {
        linkedTableId: guestsTableId,
        prefersSingleRecordLink: true
      }
    });
    console.log('✅ Collector link created!');

    // Step 4a: Add second link for person who was scanned
    console.log('🔗 Creating Collected_Guest_Record link field in Stamps...');
    await apiRequest('POST', `/tables/${stampsTableId}/fields`, {
      name: 'Collected_Guest_Record',
      type: 'multipleRecordLinks',
      options: {
        linkedTableId: guestsTableId,
        prefersSingleRecordLink: true
      }
    });
    console.log('✅ Collected_Guest_Record link created!');

    // Step 5: The inverse links should be auto-created - verify and rename
    console.log('\n🔍 Verifying auto-created reverse links in Guests...');
    let guestsFieldsUpdated = await apiRequest('GET', `/tables/${guestsTableId}/fields`);

    // Find the Stamps_Collected link (from Collector)
    const stampsCollectedField = guestsFieldsUpdated.fields.find(f =>
      f.type === 'multipleRecordLinks' &&
      f.options.linkedTableId === stampsTableId &&
      f.options.inverseLinkFieldId
    );

    if (stampsCollectedField && stampsCollectedField.name !== 'Stamps_Collected') {
      console.log(`🔄 Renaming "${stampsCollectedField.name}" to "Stamps_Collected"...`);
      await apiRequest('PATCH', `/tables/${guestsTableId}/fields/${stampsCollectedField.id}`, {
        name: 'Stamps_Collected',
        description: 'All stamps collected by this guest (they are the collector)'
      });
      console.log('✅ Stamps_Collected renamed!');
    }

    // Find the Stamps link (from Collected_Guest_Record)
    const stampsField = guestsFieldsUpdated.fields.find(f =>
      f.type === 'multipleRecordLinks' &&
      f.options.linkedTableId === stampsTableId &&
      f.options.inverseLinkFieldId &&
      f.id !== stampsCollectedField?.id
    );

    if (stampsField && stampsField.name !== 'Stamps') {
      console.log(`🔄 Renaming "${stampsField.name}" to "Stamps"...`);
      await apiRequest('PATCH', `/tables/${guestsTableId}/fields/${stampsField.id}`, {
        name: 'Stamps',
        description: 'Stamps where this guest was scanned by others'
      });
      console.log('✅ Stamps renamed!');
    }

    // Refresh field list
    guestsFieldsUpdated = await apiRequest('GET', `/tables/${guestsTableId}/fields`);
    const finalStampsCollectedField = guestsFieldsUpdated.fields.find(f => f.name === 'Stamps_Collected');

    // Step 6: Add Stamp_Count field to Guests (COUNT type, not formula)
    console.log('\n🔢 Creating Stamp_Count count field...');
    await apiRequest('POST', `/tables/${guestsTableId}/fields`, {
      name: 'Stamp_Count',
      type: 'count',
      options: {
        recordLinkFieldId: finalStampsCollectedField.id
      }
    });
    console.log('✅ Stamp_Count count field created!');

    // Step 7: Add lookup fields to Stamps table
    console.log('\n🔍 Creating lookup fields in Stamps table...');

    // Get Stamps field IDs
    const stampsFields = await apiRequest('GET', `/tables/${stampsTableId}/fields`);
    const collectorField = stampsFields.fields.find(f => f.name === 'Collector');
    const collectedGuestRecordField = stampsFields.fields.find(f => f.name === 'Collected_Guest_Record');

    if (!collectorField || !collectedGuestRecordField) {
      throw new Error('Link fields not found in Stamps table');
    }

    // Get Guests field IDs
    const nameField = guestsFieldsUpdated.fields.find(f => f.name === 'Name');
    const countryAbvField = guestsFieldsUpdated.fields.find(f => f.name === 'Country (abv)');

    // Add Collected_Guest lookup (name of collector)
    await apiRequest('POST', `/tables/${stampsTableId}/fields`, {
      name: 'Collected_Guest',
      type: 'multipleLookupValues',
      options: {
        recordLinkFieldId: collectorField.id,
        fieldIdInLinkedTable: nameField.id
      }
    });
    console.log('✅ Collected_Guest lookup created!');

    // Add Collected_Country lookup (country of collector)
    await apiRequest('POST', `/tables/${stampsTableId}/fields`, {
      name: 'Collected_Country',
      type: 'multipleLookupValues',
      options: {
        recordLinkFieldId: collectorField.id,
        fieldIdInLinkedTable: countryAbvField.id
      }
    });
    console.log('✅ Collected_Country lookup created!');

    // Add lookups for person who was scanned
    await apiRequest('POST', `/tables/${stampsTableId}/fields`, {
      name: 'Name (from Collected_Guest_Record)',
      type: 'multipleLookupValues',
      options: {
        recordLinkFieldId: collectedGuestRecordField.id,
        fieldIdInLinkedTable: nameField.id
      }
    });
    console.log('✅ Name (from Collected_Guest_Record) lookup created!');

    await apiRequest('POST', `/tables/${stampsTableId}/fields`, {
      name: 'Country (from Collected_Guest_Record)',
      type: 'multipleLookupValues',
      options: {
        recordLinkFieldId: collectedGuestRecordField.id,
        fieldIdInLinkedTable: countryAbvField.id
      }
    });
    console.log('✅ Country (from Collected_Guest_Record) lookup created!');

    // Step 8: Create GameSettings table
    console.log('\n📋 Creating GameSettings table...');
    const gameSettingsTable = await apiRequest('POST', '/tables', {
      name: 'GameSettings',
      description: 'Controls game state and summary status (should contain exactly ONE record)',
      fields: [
        {
          name: 'Game Number',
          type: 'singleLineText'
        },
        {
          name: 'GameActive',
          type: 'checkbox',
          options: {
            icon: 'check',
            color: 'greenBright'
          }
        },
        {
          name: 'GameEndedAt',
          type: 'dateTime',
          options: {
            dateFormat: {
              name: 'us',
              format: 'M/D/YYYY'
            },
            timeFormat: {
              name: '12hour',
              format: 'h:mma'
            },
            timeZone: 'client'
          }
        },
        {
          name: 'SummariesSent',
          type: 'checkbox'
        },
        {
          name: 'SummariesSentAt',
          type: 'dateTime',
          options: {
            dateFormat: {
              name: 'us',
              format: 'M/D/YYYY'
            },
            timeFormat: {
              name: '12hour',
              format: 'h:mma'
            },
            timeZone: 'client'
          }
        }
      ]
    });
    console.log('✅ GameSettings table created!');

    // Step 9: Create ErrorLog table
    console.log('\n📋 Creating ErrorLog table...');
    const errorLogTable = await apiRequest('POST', '/tables', {
      name: 'ErrorLog',
      description: 'Tracks errors and validation failures',
      fields: [
        {
          name: 'Phone',
          type: 'phoneNumber'
        },
        {
          name: 'Guest_Name',
          type: 'singleLineText'
        },
        {
          name: 'Error_Type',
          type: 'singleSelect',
          options: {
            choices: [
              { name: 'INVALID_CODE' },
              { name: 'ALREADY_COLLECTED' },
              { name: 'SELF_SCAN' },
              { name: 'NOT_ACTIVATED' },
              { name: 'RATE_LIMIT' },
              { name: 'CHANNEL_BLOCKED' },
              { name: 'GAME_ENDED' },
              { name: 'SYSTEM_ERROR' }
            ]
          }
        },
        {
          name: 'Error_Message',
          type: 'multilineText'
        },
        {
          name: 'Timestamp',
          type: 'dateTime',
          options: {
            dateFormat: {
              name: 'us',
              format: 'M/D/YYYY'
            },
            timeFormat: {
              name: '12hour',
              format: 'h:mma'
            },
            timeZone: 'client'
          }
        }
      ]
    });
    console.log('✅ ErrorLog table created!');

    // Success summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 AIRTABLE SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n✅ Tables Created:');
    console.log('   • Global Countries (reference table with 4 fields)');
    console.log('   • Guests (with 16+ fields including formulas and lookups)');
    console.log('   • Stamps (with 9 fields including lookups)');
    console.log('   • GameSettings (with 5 fields)');
    console.log('   • ErrorLog (with 5 fields)');
    console.log('\n✅ Relationships Configured:');
    console.log('   • Guests ←→ Global Countries (country reference)');
    console.log('   • Guests ←→ Stamps (two-way: collector and collected)');
    console.log('   • Stamp_Count auto-computed');
    console.log('   • All lookup fields configured');
    console.log('\n✅ Formulas Active:');
    console.log('   • Phone_formatted (normalizes phone numbers)');
    console.log('   • ID_Code (auto-generates from phone)');
    console.log('\n⚠️  IMPORTANT: Create Initial GameSettings Record');
    console.log('   1. Open GameSettings table in Airtable');
    console.log('   2. Create ONE record:');
    console.log('      - Game Number: "1" (or any identifier)');
    console.log('      - GameActive: ✓ (checked)');
    console.log('      - Leave other fields empty');
    console.log('\n📋 Next Steps:');
    console.log('   1. Create initial GameSettings record (see above)');
    console.log('   2. Import country data into Global Countries table');
    console.log('      (Use a CSV with: Country, Alpha 2 Code, Regions, ISO Languages)');
    console.log('   3. Import guest data CSV into Guests table');
    console.log('      (Link Country field after import)');
    console.log('   4. Copy Base ID and API Key to .env file');
    console.log('   5. Deploy to Twilio: twilio serverless:deploy');
    console.log('\n🔗 Base URL:');
    console.log(`   https://airtable.com/${BASE_ID}\n`);

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('   • Verify your API key has schema.bases:write scope');
    console.error('   • Check that the Base ID is correct');
    console.error('   • Ensure the base is empty (no tables with same names)');
    console.error('   • Visit https://airtable.com/account to check API status\n');
    process.exit(1);
  }
}

// Run setup
setupAirtable();
