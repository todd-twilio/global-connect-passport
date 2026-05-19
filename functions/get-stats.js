/**
 * Twilio Function: Get Stats
 *
 * Returns real-time game statistics for admin dashboard
 *
 * Output:
 * - totalGuests: Total guests in database
 * - activatedGuests: Guests who have activated
 * - totalStamps: Total stamps collected
 * - completedGuests: Guests with required stamps
 * - giftsRedeemed: Number of gifts claimed
 * - recentActivity: Last 10 stamps collected
 * - leaderboard: Top stamp collectors
 * - stampsRequired: Number of stamps needed to complete (from config)
 */

exports.handler = async function(context, event, callback) {
  const Airtable = require('airtable');

  const base = new Airtable({
    apiKey: context.AIRTABLE_API_KEY
  }).base(context.AIRTABLE_BASE_ID);

  // Get stamps required from environment variable (default to 10)
  const stampsRequired = parseInt(context.STAMPS_REQUIRED || '10', 10);

  // Helper function to extract value from Airtable lookup/linked record fields
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

  try {
    // Get game settings
    let gameSettings = {
      gameActive: false,
      summariesSent: false
    };

    try {
      const settingsRecords = await base('GameSettings')
        .select({ maxRecords: 1 })
        .firstPage();

      if (settingsRecords.length > 0) {
        const settings = settingsRecords[0];
        gameSettings = {
          gameActive: settings.fields.GameActive === true,
          gameEndedAt: settings.fields.GameEndedAt || null,
          summariesSent: settings.fields.SummariesSent === true,
          summariesSentAt: settings.fields.SummariesSentAt || null
        };
      }
    } catch (error) {
      console.log('GameSettings table not found or error:', error.message);
      // Continue with defaults
    }

    // Get all guests
    const allGuests = await base('Guests')
      .select()
      .all();

    // Get all stamps
    const allStamps = await base('Stamps')
      .select({
        sort: [{field: 'Timestamp', direction: 'desc'}]
      })
      .all();

    // Calculate stats
    const totalGuests = allGuests.length;
    const activatedGuests = allGuests.filter(g => g.fields.Activated).length;
    const totalStamps = allStamps.length;

    // Count completed guests by actually counting their stamps (don't trust formula)
    const completedGuests = allGuests.filter(g => {
      const guestStamps = allStamps.filter(s => {
        const collectorId = s.fields.Collector ? s.fields.Collector[0] : null;
        return collectorId === g.id;
      });
      return guestStamps.length >= stampsRequired;
    }).length;

    const giftsRedeemed = allGuests.filter(g => g.fields.Gift_Redeemed).length;

    // Recent activity (last 10 stamps)
    const recentActivity = allStamps.slice(0, 10).map(stamp => {
      // Try both "Timestamp" and "Created" field names
      const timestamp = stamp.fields.Timestamp || stamp.createdTime;
      console.log('Stamp timestamp:', timestamp, 'Fields:', Object.keys(stamp.fields));

      // Get collector country by finding the guest
      const collectorId = stamp.fields.Collector ? stamp.fields.Collector[0] : null;
      const collectorGuest = allGuests.find(g => g.id === collectorId);
      const collectorCountry = collectorGuest ? extractValue(collectorGuest.fields['Country (abv)']) : null;

      return {
        collectorName: stamp.fields.Collected_Guest ? stamp.fields.Collected_Guest[0] : 'Unknown',
        collectedCode: stamp.fields.Collected_Code,
        collectorCountry: collectorCountry,
        timestamp: timestamp
      };
    });

    // Leaderboard (top 10) - calculate stamp count from actual stamps
    const leaderboard = allGuests
      .map((g, index) => {
        const guestStamps = allStamps.filter(s => {
          const collectorId = s.fields.Collector ? s.fields.Collector[0] : null;
          return collectorId === g.id;
        });
        const stampCount = guestStamps.length;

        // Get timestamp of their latest stamp for tiebreaking
        let latestStampTime = null;
        if (guestStamps.length > 0) {
          const timestamps = guestStamps
            .map(s => s.fields.Timestamp || s.createdTime)
            .filter(t => t)
            .map(t => new Date(t).getTime());
          if (timestamps.length > 0) {
            latestStampTime = Math.max(...timestamps);
          }
        }

        return {
          name: g.fields.Name,
          country: extractValue(g.fields['Country (abv)']),
          stampCount: stampCount,
          completed: stampCount >= stampsRequired,
          activated: g.fields.Activated || false,
          giftRedeemed: g.fields.Gift_Redeemed || false,
          email: g.fields.Email || null,
          latestStampTime: latestStampTime,
          originalIndex: index // Preserve original order as final tiebreaker
        };
      })
      .sort((a, b) => {
        // Primary: sort by stamp count descending
        if (b.stampCount !== a.stampCount) {
          return b.stampCount - a.stampCount;
        }
        // Secondary: if tied, earlier timestamp wins (reached score first)
        if (a.latestStampTime && b.latestStampTime) {
          return a.latestStampTime - b.latestStampTime;
        }
        // Tertiary: preserve original order if no timestamps
        return a.originalIndex - b.originalIndex;
      })
      .slice(0, 10);

    // Guests who completed but haven't redeemed - calculate from actual stamps
    const pendingRedemptions = allGuests
      .filter(g => {
        if (g.fields.Gift_Redeemed) return false;
        const guestStamps = allStamps.filter(s => {
          const collectorId = s.fields.Collector ? s.fields.Collector[0] : null;
          return collectorId === g.id;
        });
        return guestStamps.length >= stampsRequired;
      })
      .map(g => {
        const guestStamps = allStamps.filter(s => {
          const collectorId = s.fields.Collector ? s.fields.Collector[0] : null;
          return collectorId === g.id;
        });

        return {
          id: g.id,
          name: g.fields.Name,
          country: extractValue(g.fields['Country (abv)']),
          stampCount: guestStamps.length,
          email: g.fields.Email || null
        };
      });

    // Map data - all activated collectors with their stamps
    const mapData = {
      collectors: [],
      stamps: []
    };

    // Get all activated collectors
    allGuests.filter(g => g.fields.Activated).forEach(g => {
      mapData.collectors.push({
        id: g.id,
        name: g.fields.Name,
        country: extractValue(g.fields['Country (abv)']),
        idCode: g.fields.ID_Code,
        email: g.fields.Email || null
      });
    });

    // Get all stamps with full details
    allStamps.forEach(stamp => {
      const collectorId = stamp.fields.Collector ? stamp.fields.Collector[0] : null;
      const targetId = stamp.fields.Collected_Guest_Record ? stamp.fields.Collected_Guest_Record[0] : null;

      if (!collectorId || !targetId) return;

      // Find collector and target guests
      const collector = allGuests.find(g => g.id === collectorId);
      const target = allGuests.find(g => g.id === targetId);

      if (!collector || !target) return;

      mapData.stamps.push({
        collectorId: collectorId,
        collectorName: collector.fields.Name,
        collectorCountry: extractValue(collector.fields['Country (abv)']),
        targetId: targetId,
        targetName: target.fields.Name,
        targetCountry: extractValue(target.fields['Country (abv)']),
        targetCode: stamp.fields.Collected_Code,
        timestamp: stamp.fields.Timestamp || stamp.createdTime
      });
    });

    // Sort stamps by timestamp for each collector to determine order
    mapData.stamps.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0);
      const timeB = new Date(b.timestamp || 0);
      return timeA - timeB;
    });

    // Fetch error log (last 500 errors)
    const errorLogRecords = await base('ErrorLog')
      .select({
        maxRecords: 500,
        sort: [{field: 'Timestamp', direction: 'desc'}]
      })
      .firstPage();

    const errorLog = errorLogRecords.map(e => ({
      timestamp: e.fields.Timestamp || e.createdTime,
      phone: e.fields.Phone,
      guestName: e.fields.Guest_Name || 'Unknown',
      errorType: e.fields.Error_Type,
      message: e.fields.Error_Message
    }));

    return callback(null, {
      success: true,
      stats: {
        totalGuests,
        activatedGuests,
        totalStamps,
        completedGuests,
        giftsRedeemed,
        recentActivity,
        leaderboard,
        pendingRedemptions,
        mapData,
        stampsRequired,
        errorLog
      },
      gameSettings: gameSettings
    });

  } catch (error) {
    console.error('Stats error:', error);
    return callback(null, {
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
};
