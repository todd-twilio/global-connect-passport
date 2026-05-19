/**
 * Twilio Function: Validate Stamp
 *
 * Validates and processes stamp collection
 *
 * Input Parameters:
 * - collectorPhone: Phone number of person collecting stamp
 * - targetCode: Badge code being scanned
 *
 * Output:
 * - success: true/false
 * - action: 'activate', 'stamp_collected', 'started', 'error'
 * - error: Error message if failed
 * - errorType: Type of error (invalid_code, self_scan, duplicate, same_country)
 * - collector: Collector guest data
 * - target: Target guest data
 * - newStampCount: Updated stamp count
 * - isComplete: Whether collector reached required stamps (configurable via STAMPS_REQUIRED)
 */

exports.handler = async function(context, event, callback) {
  const Airtable = require('airtable');
  const { getFlagFromCode } = require(Runtime.getFunctions()['helpers/country-flags'].path);
  const { getGreetingWithAudio } = require(Runtime.getFunctions()['helpers/country-greetings'].path);

  const base = new Airtable({
    apiKey: context.AIRTABLE_API_KEY
  }).base(context.AIRTABLE_BASE_ID);

  // Helper function to extract value from Airtable lookup/linked record fields
  // These fields return arrays like ["United States"] or sometimes nested arrays
  function extractValue(field) {
    if (!field) return null;
    if (Array.isArray(field)) {
      // Handle nested arrays
      if (field.length > 0 && Array.isArray(field[0])) {
        return field[0][0];
      }
      return field[0];
    }
    return field;
  }

  // Helper function to log errors to ErrorLog table
  async function logError(phone, guestName, errorType, friendlyMessage) {
    try {
      await base('ErrorLog').create({
        Phone: phone,
        Guest_Name: guestName || 'Unknown',
        Error_Type: errorType,
        Error_Message: friendlyMessage,
        Timestamp: new Date().toISOString()
      });
    } catch (err) {
      // Don't fail if logging fails
      console.error('Failed to log error:', err);
    }
  }

  const collectorPhoneRaw = event.collectorPhone;
  const targetCodeRaw = event.targetCode;

  if (!collectorPhoneRaw || !targetCodeRaw) {
    return callback(null, {
      success: false,
      action: 'error',
      errorType: 'missing_parameters'
    });
  }

  // Detect channel and normalize phone number
  const isWhatsApp = collectorPhoneRaw.startsWith('whatsapp:');
  const collectorPhone = collectorPhoneRaw.replace('whatsapp:', '');
  const collectorChannel = isWhatsApp ? 'whatsapp' : 'sms';

  try {
    // 0. Check channel is allowed (fraud prevention)
    const allowSMS = context.ALLOW_SMS === 'true';
    const allowWhatsApp = context.ALLOW_WHATSAPP === 'true';

    if (isWhatsApp && !allowWhatsApp) {
      await logError(collectorPhone, null, 'channel_disabled', 'WhatsApp is currently disabled');
      return callback(null, {
        success: false,
        action: 'error',
        errorType: 'channel_disabled'
      });
    }

    if (!isWhatsApp && !allowSMS) {
      await logError(collectorPhone, null, 'channel_disabled', 'SMS is currently disabled');
      return callback(null, {
        success: false,
        action: 'error',
        errorType: 'channel_disabled'
      });
    }

    // 1. Check if game is still active
    const settingsRecords = await base('GameSettings')
      .select({
        maxRecords: 1
      })
      .firstPage();

    if (settingsRecords.length > 0) {
      const gameSettings = settingsRecords[0];
      if (gameSettings.fields.GameActive !== true) {
        return callback(null, {
          success: true,
          action: 'game_ended',
          message: 'Thank you for playing Twilio Global Connect! Enjoy the rest of the event.'
        });
      }
    }

    // 2. Lookup collector by phone first (needed for all responses)
    const collectorRecords = await base('Guests')
      .select({
        filterByFormula: `{Phone_formatted} = "${collectorPhone}"`,
        maxRecords: 1
      })
      .firstPage();

    if (collectorRecords.length === 0) {
      // User doesn't exist
      await logError(collectorPhone, null, 'not_registered', 'Phone number not registered in system');
      return callback(null, {
        success: false,
        action: 'error',
        errorType: 'not_registered'
      });
    }

    const collector = collectorRecords[0];

    // 3. Check rate limiting (fraud prevention - message pumping)
    const rateLimitSeconds = parseInt(context.RATE_LIMIT_SECONDS || '3', 10);
    const lastMessageTime = collector.fields.Last_Message_Time;

    if (lastMessageTime) {
      const lastMessageDate = new Date(lastMessageTime);
      const now = new Date();
      const secondsSinceLastMessage = (now - lastMessageDate) / 1000;

      if (secondsSinceLastMessage < rateLimitSeconds) {
        const collectorCountry = extractValue(collector.fields['Country (abv)']);
        const waitSeconds = Math.ceil(rateLimitSeconds - secondsSinceLastMessage);
        await logError(
          collectorPhone,
          collector.fields.Name,
          'rate_limited',
          `Sent messages too quickly (wait ${waitSeconds}s)`
        );
        return callback(null, {
          success: false,
          action: 'error',
          errorType: 'rate_limited',
          collector: {
            id: collector.id,
            idCode: collector.fields.ID_Code,
            name: collector.fields.Name,
            country: collectorCountry,
            countryFlag: getFlagFromCode(collectorCountry),
            activated: collector.fields.Activated
          },
          waitSeconds: waitSeconds
        });
      }
    }

    // Update last message timestamp
    await base('Guests').update(collector.id, {
      Last_Message_Time: new Date().toISOString()
    });

    // 4. Check if message is "start" or "Start" keyword
    const trimmedCode = targetCodeRaw.toString().trim();
    if (trimmedCode.toLowerCase() === 'start') {
      const collectorCountry = extractValue(collector.fields['Country (abv)']);
      const personalizedGreeting = extractValue(collector.fields['Personalized Greeting']);

      // Check if already activated
      if (collector.fields.Activated) {
        await logError(
          collectorPhone,
          collector.fields.Name,
          'already_activated',
          'Account already activated'
        );
        return callback(null, {
          success: false,
          action: 'error',
          errorType: 'already_activated',
          collector: {
            id: collector.id,
            idCode: collector.fields.ID_Code,
            name: collector.fields.Name,
            country: collectorCountry,
            countryFlag: getFlagFromCode(collectorCountry),
            activated: collector.fields.Activated
          }
        });
      }

      // Activate the user and set their preferred channel
      const updateFields = {
        Activated: true,
        Preferred_Channel: collectorChannel
      };

      await base('Guests').update(collector.id, updateFields);

      return callback(null, {
        success: true,
        action: 'started',
        collector: {
          id: collector.id,
          idCode: collector.fields.ID_Code,
          name: collector.fields.Name,
          country: collectorCountry,
          countryFlag: getFlagFromCode(collectorCountry),
          activated: true, // Now activated
          personalizedGreeting: personalizedGreeting
        }
      });
    }

    // 5. Check if message is a 4-digit number
    const targetCode = trimmedCode;
    const isValid4DigitCode = /^\d{4}$/.test(trimmedCode);

    if (!isValid4DigitCode) {
      // User exists but sent invalid format
      const collectorCountry = extractValue(collector.fields['Country (abv)']);

      // Check if message contains URL and user is activated (for LinkedIn profile collection)
      if (trimmedCode.toLowerCase().includes('http') && collector.fields.Activated) {
        await logError(
          collectorPhone,
          collector.fields.Name,
          'url_detected',
          `URL detected: ${trimmedCode}`
        );
        return callback(null, {
          success: false,
          action: 'error',
          errorType: 'url_detected',
          collector: {
            id: collector.id,
            idCode: collector.fields.ID_Code,
            name: collector.fields.Name,
            country: collectorCountry,
            countryFlag: getFlagFromCode(collectorCountry),
            activated: collector.fields.Activated
          }
        });
      }

      // Regular invalid format error
      await logError(
        collectorPhone,
        collector.fields.Name,
        'invalid_format',
        `Invalid code format: "${trimmedCode}" (must be 4 digits)`
      );
      return callback(null, {
        success: false,
        action: 'error',
        errorType: 'invalid_format',
        collector: {
          id: collector.id,
          idCode: collector.fields.ID_Code,
          name: collector.fields.Name,
          country: collectorCountry,
          countryFlag: getFlagFromCode(collectorCountry),
          activated: collector.fields.Activated
        }
      });
    }

    // Check if user is trying to collect stamps without being activated
    if (!collector.fields.Activated && collector.fields.ID_Code !== targetCode) {
      const collectorCountry = extractValue(collector.fields['Country (abv)']);
      await logError(
        collectorPhone,
        collector.fields.Name,
        'not_activated',
        'Tried to collect stamps without activating (must text own code first)'
      );
      return callback(null, {
        success: false,
        action: 'error',
        errorType: 'not_activated',
        collector: {
          id: collector.id,
          idCode: collector.fields.ID_Code,
          name: collector.fields.Name,
          country: collectorCountry,
          countryFlag: getFlagFromCode(collectorCountry),
          activated: collector.fields.Activated
        }
      });
    }

    // 6. Check if this is activation (texting their own code)
    if (collector.fields.ID_Code === targetCode) {
      const collectorCountry = extractValue(collector.fields['Country (abv)']);
      const personalizedGreeting = extractValue(collector.fields['Personalized Greeting']);

      // Check if already activated
      if (collector.fields.Activated) {
        await logError(
          collectorPhone,
          collector.fields.Name,
          'already_activated',
          'Account already activated'
        );
        return callback(null, {
          success: false,
          action: 'error',
          errorType: 'already_activated',
          collector: {
            id: collector.id,
            idCode: collector.fields.ID_Code,
            name: collector.fields.Name,
            country: collectorCountry,
            countryFlag: getFlagFromCode(collectorCountry),
            activated: collector.fields.Activated
          }
        });
      }

      // Activate the guest and set their preferred channel
      const updateFields = {
        Activated: true,
        Preferred_Channel: collectorChannel
      };

      await base('Guests').update(collector.id, updateFields);

      return callback(null, {
        success: true,
        action: 'activate',
        collector: {
          id: collector.id,
          idCode: collector.fields.ID_Code,
          name: collector.fields.Name,
          country: collectorCountry,
          countryFlag: getFlagFromCode(collectorCountry),
          activated: true,
          personalizedGreeting: personalizedGreeting
        }
      });
    }

    // Update channel preference on any interaction (in case it changes)
    if (collector.fields.Preferred_Channel !== collectorChannel) {
      await base('Guests').update(collector.id, {
        Preferred_Channel: collectorChannel
      });
    }

    // 7. Lookup target by code
    const targetRecords = await base('Guests')
      .select({
        filterByFormula: `{ID_Code} = "${targetCode}"`,
        maxRecords: 1
      })
      .firstPage();

    if (targetRecords.length === 0) {
      const collectorCountry = extractValue(collector.fields['Country (abv)']);
      await logError(
        collectorPhone,
        collector.fields.Name,
        'invalid_code',
        `Invalid code entered: ${targetCode}`
      );
      return callback(null, {
        success: false,
        action: 'error',
        errorType: 'invalid_code',
        collector: {
          id: collector.id,
          idCode: collector.fields.ID_Code,
          name: collector.fields.Name,
          country: collectorCountry,
          countryFlag: getFlagFromCode(collectorCountry),
          activated: collector.fields.Activated
        }
      });
    }

    const target = targetRecords[0];

    // 8. Check for duplicate stamp - query stamps by Collected_Code first, then filter by collector
    const allStampsWithCode = await base('Stamps')
      .select({
        filterByFormula: `{Collected_Code} = "${targetCode}"`
      })
      .all();

    console.log(`Found ${allStampsWithCode.length} stamps with code ${targetCode}`);

    // Check if any of these stamps belong to this collector
    const hasDuplicate = allStampsWithCode.some(stamp => {
      const stampCollectorId = stamp.fields.Collector ? stamp.fields.Collector[0] : null;
      console.log(`Comparing stamp collector ${stampCollectorId} with ${collector.id}`);
      return stampCollectorId === collector.id;
    });

    if (hasDuplicate) {
      console.log(`Duplicate found: Collector ${collector.id} already has code ${targetCode}`);
      const collectorCountry = extractValue(collector.fields['Country (abv)']);
      const targetName = target.fields.Name;
      await logError(
        collectorPhone,
        collector.fields.Name,
        'duplicate_stamp',
        `Already collected stamp from ${targetName}`
      );
      return callback(null, {
        success: false,
        action: 'error',
        errorType: 'duplicate_stamp',
        collector: {
          id: collector.id,
          idCode: collector.fields.ID_Code,
          name: collector.fields.Name,
          country: collectorCountry,
          countryFlag: getFlagFromCode(collectorCountry),
          activated: collector.fields.Activated
        }
      });
    }

    // 9. Create stamp record
    await base('Stamps').create({
      Collector: [collector.id],
      Collected_Code: targetCode,
      Collected_Guest_Record: [target.id]
    });

    // 10. Get updated stamp count - fetch all stamps and filter in JavaScript
    // (Airtable formulas don't work reliably with linked records)
    const allStampsAfterCreate = await base('Stamps')
      .select()
      .all();

    const updatedCollectorStamps = allStampsAfterCreate.filter(s => {
      const stampCollectorId = s.fields.Collector ? s.fields.Collector[0] : null;
      return stampCollectorId === collector.id;
    });

    const newStampCount = updatedCollectorStamps.length;
    const stampsRequired = parseInt(context.STAMPS_REQUIRED || '10', 10);
    const isComplete = newStampCount >= stampsRequired;

    console.log(`Collector ${collector.id} now has ${newStampCount} stamps (from ${allStampsAfterCreate.length} total stamps)`);

    // 11. Return success with both guest data
    const collectorCountry = extractValue(collector.fields['Country (abv)']);
    const targetCountry = extractValue(target.fields['Country (abv)']);

    // Determine if countries match for language branching in Studio
    const languageMatch = (collectorCountry === targetCountry) ? 'same' : 'different';

    // Get greeting with audio URL for the target's country
    const targetGreeting = getGreetingWithAudio(targetCountry);

    return callback(null, {
      success: true,
      action: 'stamp_collected',
      languageMatch: languageMatch,
      collector: {
        id: collector.id,
        idCode: collector.fields.ID_Code,
        name: collector.fields.Name,
        country: collectorCountry,
        stampsGreetingIntro: collector.fields['Stamps Greeting intro'],
        countryFlag: getFlagFromCode(collectorCountry),
        activated: collector.fields.Activated
      },
      target: {
        id: target.id,
        idCode: target.fields.ID_Code,
        name: target.fields.Name,
        country: targetCountry,
        linkedin: target.fields.LinkedIn_URL_Finder || null,
        phone: target.fields.Preferred_Channel === 'whatsapp'
          ? `whatsapp:${target.fields.Phone_formatted}`
          : target.fields.Phone_formatted,
        countryFlag: getFlagFromCode(targetCountry),
        stampsGreeting: target.fields['Stamps Greeting'],
        audioUrl: targetGreeting.audioUrl
      },
      newStampCount: newStampCount,
      isComplete: isComplete
    });

  } catch (error) {
    console.error('Validation error:', error);
    return callback(null, {
      success: false,
      action: 'error',
      errorType: 'system_error'
    });
  }
};
