/**
 * Twilio Function: End Game / Activate Game (Toggle)
 *
 * Toggles game active state in GameSettings table
 *
 * Input Parameters:
 * - action: 'end' or 'activate' (optional, defaults to toggle)
 *
 * Output:
 * - success: true/false
 * - gameActive: Current game status
 * - endedAt: Timestamp when game ended (null if reactivated)
 * - error: Error message if failed
 */

exports.handler = async function(context, event, callback) {
  const Airtable = require('airtable');

  const base = new Airtable({
    apiKey: context.AIRTABLE_API_KEY
  }).base(context.AIRTABLE_BASE_ID);

  const action = event.action; // 'end' or 'activate'

  try {
    // Get the single GameSettings record
    const settingsRecords = await base('GameSettings')
      .select({
        maxRecords: 1
      })
      .firstPage();

    if (settingsRecords.length === 0) {
      return callback(null, {
        success: false,
        error: 'GameSettings record not found. Please create the GameSettings table with one record.'
      });
    }

    const settingsRecord = settingsRecords[0];
    const currentlyActive = settingsRecord.fields.GameActive === true;

    // Determine what to do
    let shouldActivate;
    if (action === 'end') {
      shouldActivate = false;
    } else if (action === 'activate') {
      shouldActivate = true;
    } else {
      // Toggle if no action specified
      shouldActivate = !currentlyActive;
    }

    // Check if already in desired state
    if (shouldActivate === currentlyActive) {
      return callback(null, {
        success: true,
        gameActive: currentlyActive,
        endedAt: settingsRecord.fields.GameEndedAt || null,
        message: shouldActivate ? 'Game is already active' : 'Game is already ended'
      });
    }

    // Update the game state
    if (shouldActivate) {
      // Reactivating - set active and clear GameEndedAt
      // Using array format with typecast to properly clear the date field
      await base('GameSettings').update([
        {
          id: settingsRecord.id,
          fields: {
            GameActive: true,
            GameEndedAt: null
          }
        }
      ], { typecast: true });
    } else {
      // Ending - set inactive and timestamp
      await base('GameSettings').update(settingsRecord.id, {
        GameActive: false,
        GameEndedAt: new Date().toISOString()
      });
    }

    console.log(`Game ${shouldActivate ? 'activated' : 'ended'} successfully`);

    return callback(null, {
      success: true,
      gameActive: shouldActivate,
      endedAt: shouldActivate ? null : new Date().toISOString()
    });

  } catch (error) {
    console.error('Error toggling game state:', error);
    return callback(null, {
      success: false,
      error: error.message
    });
  }
};
