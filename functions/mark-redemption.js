/**
 * Twilio Function: Mark Redemption
 *
 * Marks a gift as redeemed by attendant
 *
 * Input Parameters:
 * - guestId: Airtable record ID of guest
 * - redeemed: true/false
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
  const redeemed = event.redeemed === 'true' || event.redeemed === true;

  if (!guestId) {
    return callback(null, {
      success: false,
      error: 'Guest ID required'
    });
  }

  try {
    await base('Guests').update(guestId, {
      Gift_Redeemed: redeemed
    });

    return callback(null, {
      success: true,
      message: redeemed ? 'Gift marked as redeemed' : 'Redemption unmarked'
    });

  } catch (error) {
    console.error('Mark redemption error:', error);
    return callback(null, {
      success: false,
      error: 'Failed to update redemption status'
    });
  }
};
