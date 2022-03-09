/* eslint-disable */

/*
This script creates a new key, isOnboardedAccount, on the smscounts db which indexes the msgSrvcId variable
*/

// == PRE-UPDATE CHECKS ==
// Count the number of verifications we have to update
db.getCollection('smscounts').count({ smsType: 'VERIFICATION' })

// == UPDATE ==
// Update verified smses
db.getCollection('smscounts').updateMany(
  { smsType: 'VERIFICATION' },
  {
    $unset: {
      isOnboardedAccount: false,
    },
  }
)

// == POST-UPDATE CHECKS ==
// Check number of verifications updated
// SHOULD BE 0
db.getCollection('smscounts').count({
  smsType: 'VERIFICATION',
  isOnboardedAccount: {
    $exists: true
  }
})