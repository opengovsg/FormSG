/* eslint-disable */

/*
Delete unused keys for all submissions
*/

// Check total submissions count
db.getCollection('submissions').count()

// Check number of submissions with isSingPassAuthenticated flag
db.getCollection('submissions')
  .find({ 'isSingPassAuthenticated': { $exists: true } })
  .count()

// !!!! MAIN UPDATE SCRIPT !!!!

// Delete unused isSingPassAuthenticated key 
// ~ number updated should match number which had key
db.getCollection('submissions').updateMany({}, {
  $unset: {
    'isSingPassAuthenticated': 1,
  }
})

// !!!! END MAIN UPDATE SCRIPT !!!!

// Check number of submissions with isSingPassAuthenticated flag 
// ~ Should be zero
db.getCollection('submissions')
  .find({ 'isSingPassAuthenticated': { $exists: true } })
  .count()

// Check total submissions count
db.getCollection('submissions').count()