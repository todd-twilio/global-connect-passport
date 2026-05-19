/**
 * Twilio Function: Send Summaries
 *
 * Sends summary messages to all activated users with their collected stamps
 * grouped by region
 *
 * Input Parameters: None
 *
 * Output:
 * - success: true/false
 * - totalUsers: Number of activated users
 * - sent: Number of messages successfully sent
 * - failed: Number of messages that failed
 * - failures: Array of failure details
 * - error: Error message if failed
 */

exports.handler = async function(context, event, callback) {
  const Airtable = require('airtable');
  const { getFlagFromCode } = require(Runtime.getFunctions()['helpers/country-flags'].path);

  const base = new Airtable({
    apiKey: context.AIRTABLE_API_KEY
  }).base(context.AIRTABLE_BASE_ID);

  // Helper function to extract value from Airtable lookup/linked record fields
  function extractValue(field) {
    if (!field) return null;
    if (Array.isArray(field)) {
      if (field.length > 0 && Array.isArray(field[0])) {
        return field[0][0];
      }
      return field[0];
    }
    return field;
  }

  // Helper function to send message via Twilio
  async function sendMessage(to, body, isWhatsApp) {
    const twilioClient = context.getTwilioClient();

    try {
      // Determine the from number based on channel
      let fromNumber;
      if (context.TWILIO_PHONE_NUMBER) {
        // If WhatsApp, add the whatsapp: prefix to the from number
        fromNumber = isWhatsApp ? `whatsapp:${context.TWILIO_PHONE_NUMBER}` : context.TWILIO_PHONE_NUMBER;
      } else {
        // Fallback to messaging service (handles both SMS and WhatsApp)
        fromNumber = 'MG your_messaging_service_sid';
      }

      const message = await twilioClient.messages.create({
        body: body,
        to: to,
        from: fromNumber
      });
      return { success: true, messageSid: message.sid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  try {
    // Check GameSettings
    console.log('Checking GameSettings...');
    const settingsRecords = await base('GameSettings')
      .select({ maxRecords: 1 })
      .firstPage();

    if (settingsRecords.length === 0) {
      return callback(null, {
        success: false,
        error: 'GameSettings record not found. Please create the GameSettings table with one record.'
      });
    }

    const settingsRecord = settingsRecords[0];

    // Check if summaries already sent
    if (settingsRecord.fields.SummariesSent) {
      return callback(null, {
        success: false,
        error: 'Summaries have already been sent',
        sentAt: settingsRecord.fields.SummariesSentAt
      });
    }

    // Get all activated guests
    console.log('Fetching activated guests...');
    const activatedGuests = await base('Guests')
      .select({
        filterByFormula: '{Activated} = TRUE()'
      })
      .all();

    console.log(`Found ${activatedGuests.length} activated guests`);

    if (activatedGuests.length === 0) {
      return callback(null, {
        success: false,
        error: 'No activated guests found'
      });
    }

    // Get all stamps
    console.log('Fetching all stamps...');
    const allStamps = await base('Stamps')
      .select()
      .all();

    console.log(`Found ${allStamps.length} total stamps`);

    const results = {
      totalUsers: activatedGuests.length,
      sent: 0,
      failed: 0,
      failures: []
    };

    // Process each guest
    for (const guest of activatedGuests) {
      try {
        // Find stamps for this collector
        const guestStamps = allStamps.filter(stamp => {
          const collectorId = stamp.fields.Collector ? stamp.fields.Collector[0] : null;
          return collectorId === guest.id;
        });

        console.log(`Guest ${guest.fields.Name} has ${guestStamps.length} stamps`);

        if (guestStamps.length === 0) {
          // Skip users with no stamps
          console.log(`Skipping ${guest.fields.Name} - no stamps collected`);
          continue;
        }

        // Get details for each collected person
        const collectedPeople = [];
        for (const stamp of guestStamps) {
          const collectedGuestId = stamp.fields.Collected_Guest_Record ? stamp.fields.Collected_Guest_Record[0] : null;
          if (collectedGuestId) {
            try {
              const collectedGuest = await base('Guests').find(collectedGuestId);
              const name = collectedGuest.fields.Name;
              const region = extractValue(collectedGuest.fields['Regions (from Country)']);
              const countryCode = extractValue(collectedGuest.fields['Country (abv)']);
              const flag = getFlagFromCode(countryCode);

              collectedPeople.push({
                name: name,
                region: region || 'Unknown',
                flag: flag
              });
            } catch (err) {
              console.error(`Error fetching collected guest ${collectedGuestId}:`, err);
            }
          }
        }

        // Group by region
        const byRegion = {};
        for (const person of collectedPeople) {
          if (!byRegion[person.region]) {
            byRegion[person.region] = [];
          }
          byRegion[person.region].push(person);
        }

        // Sort regions by count (most contacts first)
        const sortedRegions = Object.keys(byRegion).sort((a, b) => {
          return byRegion[b].length - byRegion[a].length;
        });

        // Build message
        let message = "Here's everyone you met today:\n\n";
        for (const region of sortedRegions) {
          message += `${region}\n`;
          for (const person of byRegion[region]) {
            message += `${person.name} ${person.flag}\n`;
          }
          message += '\n';
        }

        // Send message
        const phone = guest.fields.Phone_formatted;
        const channel = guest.fields.Preferred_Channel;
        const isWhatsApp = channel === 'whatsapp';
        const recipientPhone = isWhatsApp ? `whatsapp:${phone}` : phone;

        console.log(`Sending summary to ${guest.fields.Name} at ${recipientPhone}`);
        const sendResult = await sendMessage(recipientPhone, message.trim(), isWhatsApp);

        if (sendResult.success) {
          results.sent++;
          console.log(`✓ Sent to ${guest.fields.Name}`);
        } else {
          results.failed++;
          results.failures.push({
            name: guest.fields.Name,
            phone: recipientPhone,
            error: sendResult.error
          });
          console.error(`✗ Failed to send to ${guest.fields.Name}: ${sendResult.error}`);
        }

      } catch (error) {
        results.failed++;
        results.failures.push({
          name: guest.fields.Name,
          phone: guest.fields.Phone_formatted,
          error: error.message
        });
        console.error(`Error processing guest ${guest.fields.Name}:`, error);
      }
    }

    // Mark summaries as sent
    await base('GameSettings').update(settingsRecord.id, {
      SummariesSent: true,
      SummariesSentAt: new Date().toISOString()
    });

    console.log(`Summary complete: ${results.sent} sent, ${results.failed} failed`);

    return callback(null, {
      success: true,
      ...results
    });

  } catch (error) {
    console.error('Error sending summaries:', error);
    return callback(null, {
      success: false,
      error: error.message
    });
  }
};
