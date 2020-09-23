/* eslint-disable */

/*
Delete unused keys for all users
*/

// Check total user count
db.getCollection('users').count()

// Check number of users with isBeta flag
db.getCollection('users')
  .find({ 'isBeta': { $exists: true } })
  .count()

// !!!! MAIN UPDATE SCRIPT !!!!

// Delete unused isBeta key 
// ~ number updated should match number which had key
db.getCollection('users').updateMany({}, {
  $unset: {
    'isBeta': 1,
  }
})

// !!!! END MAIN UPDATE SCRIPT !!!!

// Check number of users with isBeta flag 
// ~ Should be zero
db.getCollection('users')
  .find({ 'isBeta': { $exists: true } })
  .count()

// Check total user count
db.getCollection('users').count()