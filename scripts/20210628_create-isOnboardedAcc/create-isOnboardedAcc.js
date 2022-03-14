/* eslint-disable */

/*
This script creates a new key, isOnboardedAccount, on the smscounts db which indexes the msgSrvcId variable
*/

let formTwilioId = 'insert the form twilio id here'

// == PRE-UPDATE CHECKS ==
// Count the number of verifications (A)
db.getCollection('smscounts').count({ smsType: 'VERIFICATION' })

// Count of forms using our twilio acc (B)
db.getCollection('smscounts').count({
  smsType: 'VERIFICATION',
msgSrvcSid: {$eq: formTwilioId},
})

// Count of forms using their own twilio acc (C)
// A === B + C
db.getCollection('smscounts').count({
  smsType: 'VERIFICATION',
  msgSrvcSid: { $ne: formTwilioId },
})


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
// Count of forms using our twilio acc
db.getCollection('smscounts').count({
  smsType: 'VERIFICATION',
  msgSrvcSid: { $eq: formTwilioId },
  isOnboardedAccount: false
})

// Count of forms using their own twilio acc
db.getCollection('smscounts').count({
  smsType: 'VERIFICATION',
  msgSrvcSid: { $ne: formTwilioId },
  isOnboardedAccount: true
})
