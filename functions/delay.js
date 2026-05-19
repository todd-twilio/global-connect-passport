/**
 * Twilio Function: Delay
 *
 * Creates a 2-second delay for sequencing messages in Studio Flow
 *
 * Input Parameters: None required
 *
 * Output:
 * - success: true
 * - message: "Delay complete"
 */

exports.handler = async function(context, event, callback) {
  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));

  return callback(null, {
    success: true,
    message: 'Delay complete'
  });
};
