/**
 * Twilio Function: Reset Game
 *
 * Resets the game state (use with caution!)
 *
 * Full Reset (no guestId):
 * - Deletes all stamps
 * - Resets all guest activation and redemption flags
 * - Resets GameSettings (reactivates game, clears summaries sent flag)
 * - Clears ErrorLog table
 *
 * Single Guest Reset (with guestId):
 * - Deletes guest's stamps
 * - Resets guest's activation and redemption flags
 *
 * Input Parameters:
 * - guestId: (Optional) Reset specific guest, or omit to reset all
 * - confirmCode: Security code to prevent accidental resets
 *
 * Output:
 * - success: true/false
 * - message: Confirmation message
 */

exports.handler = async function(context, event, callback) {
  const Airtable = require('airtable');

  const base = new Airtable({
    apiKey: context.AIRTABLE_API_KEY
  }).base(context.AIRTABLE_BASE_ID);

  const guestId = event.guestId;
  const confirmCode = event.confirmCode;

  console.log('Reset attempt - Received code:', confirmCode, 'Expected:', context.RESET_CONFIRM_CODE);

  // Security check
  if (!confirmCode || confirmCode !== context.RESET_CONFIRM_CODE) {
    console.log('Reset failed - code mismatch');
    return callback(null, {
      success: false,
      error: `Invalid confirmation code. Received: "${confirmCode}"`
    });
  }

  console.log('Reset authorized, proceeding...');

  try {
    if (guestId) {
      // Reset single guest
      // 1. Delete their stamps
      const stamps = await base('Stamps')
        .select({
          filterByFormula: `{Collector} = "${guestId}"`
        })
        .all();

      for (const stamp of stamps) {
        await base('Stamps').destroy(stamp.id);
      }

      // 2. Reset their flags
      await base('Guests').update(guestId, {
        Activated: false,
        Gift_Redeemed: false
      });

      return callback(null, {
        success: true,
        message: `Guest reset successfully`
      });

    } else {
      // Full game reset
      // 1. Delete all stamps
      const allStamps = await base('Stamps')
        .select()
        .all();

      // Airtable limits to 10 deletes at a time
      for (let i = 0; i < allStamps.length; i += 10) {
        const batch = allStamps.slice(i, i + 10).map(s => s.id);
        await base('Stamps').destroy(batch);
      }

      // 2. Reset all guest flags
      const allGuests = await base('Guests')
        .select()
        .all();

      for (let i = 0; i < allGuests.length; i += 10) {
        const batch = allGuests.slice(i, i + 10).map(g => ({
          id: g.id,
          fields: {
            Activated: false,
            Gift_Redeemed: false
          }
        }));
        await base('Guests').update(batch);
      }

      // 3. Reset GameSettings
      const settingsRecords = await base('GameSettings')
        .select({ maxRecords: 1 })
        .firstPage();

      if (settingsRecords.length > 0) {
        await base('GameSettings').update([{
          id: settingsRecords[0].id,
          fields: {
            GameActive: true,
            GameEndedAt: null,
            SummariesSent: false,
            SummariesSentAt: null
          }
        }], { typecast: true });
      }

      // 4. Clear ErrorLog
      const allErrors = await base('ErrorLog')
        .select()
        .all();

      // Airtable limits to 10 deletes at a time
      for (let i = 0; i < allErrors.length; i += 10) {
        const batch = allErrors.slice(i, i + 10).map(e => e.id);
        await base('ErrorLog').destroy(batch);
      }

      return callback(null, {
        success: true,
        message: `Full game reset: ${allStamps.length} stamps deleted, ${allGuests.length} guests reset, ${allErrors.length} errors cleared, game reactivated`
      });
    }

  } catch (error) {
    console.error('Reset error:', error);
    return callback(null, {
      success: false,
      error: 'Reset failed'
    });
  }
};
