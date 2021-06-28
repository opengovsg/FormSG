/* eslint-disable */

/*
This script creates a new key, isOnboardedAccount, on the smscounts db which indexes the msgSrvcId variable
*/

let formTwilioId = 'insert the form twilio id here'

// == PRE-UPDATE CHECKS ==
// Count the number of verifications
db.getCollection('smscounts').count({ smsType: 'VERIFICATION' })

// == UPDATE ==
// Update verifications which have message service id equal to form twilio id
db.getCollection('smscounts').updateMany(
  { smsType: 'VERIFICATION', msgSrvcSid: { $eq: formTwilioId } },
  {
    $set: {
      isOnboardedAccount: false,
    },
  }
)

// Update verifications whose message service id is not equal to form twilio id
db.getCollection('smscounts').updateMany(
  { smsType: 'VERIFICATION', msgSrvcSid: { $ne: formTwilioId } },
  {
    $set: {
      isOnboardedAccount: true,
    },
  }
)

// == POST-UPDATE CHECKS ==

// Check number of verifications updated
// Sum of these two should be equal to the initial count
db.getCollection('smscounts').count({
  smsType: 'VERIFICATION',
msgSrvcSid: {$eq: formTwilioId},
})
db.getCollection('smscounts').count({
  smsType: 'VERIFICATION',
  msgSrvcSid: { $ne: formTwilioId },
})
