/**
 * Twilio Function: Lookup Guest
 *
 * Looks up a guest by phone number in Airtable
 *
 * Input Parameters:
 * - phone: E.164 formatted phone number
 *
 * Output:
 * - success: true/false
 * - guest: Guest record if found
 * - error: Error message if failed
 */

exports.handler = async function(context, event, callback) {
  const Airtable = require('airtable');

  // Initialize Airtable
  const base = new Airtable({
    apiKey: context.AIRTABLE_API_KEY
  }).base(context.AIRTABLE_BASE_ID);

  const phone = event.phone;

  if (!phone) {
    return callback(null, {
      success: false,
      error: 'Phone number required'
    });
  }

  try {
    // Query Airtable for guest by phone
    const records = await base('Guests')
      .select({
        filterByFormula: `{Phone_formatted} = "${phone}"`,
        maxRecords: 1
      })
      .firstPage();

    if (records.length === 0) {
      return callback(null, {
        success: false,
        error: 'Guest not found'
      });
    }

    const guest = records[0];

    return callback(null, {
      success: true,
      guest: {
        id: guest.id,
        idCode: guest.fields.ID_Code,
        name: guest.fields.Name,
        phone: guest.fields.Phone_formatted,
        country: guest.fields.Country,
        // Try AI-generated LinkedIn first, fall back to regular LinkedIn field
        linkedin: guest.fields.LinkedIn_URL_Finder || guest.fields.LinkedIn || null,
        stampCount: guest.fields.Stamp_Count || 0,
        activated: guest.fields.Activated || false,
        giftRedeemed: guest.fields.Gift_Redeemed || false
      }
    });

  } catch (error) {
    console.error('Airtable error:', error);
    return callback(null, {
      success: false,
      error: 'Database error'
    });
  }
};
