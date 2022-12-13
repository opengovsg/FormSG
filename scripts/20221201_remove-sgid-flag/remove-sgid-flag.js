/* eslint-disable */

/*
Delete sgid betaFlag for all users
*/

// Check total user count
db.getCollection('users').count()

// Check number of users with sgid flag
db.getCollection('users')
  .find({ 'betaFlags.sgid': { $exists: true } })
  .count()

// Delete sgid Flag ~ number updated should match number which had flag
db.getCollection('users').updateMany({}, {
  $unset: {
    'betaFlags.sgid': 1,
  }
})

// Check total user count
db.getCollection('users').count()

// Check number of users with sgid flag ~ Should be zero
db.getCollection('users')
  .find({ 'betaFlags.sgid': { $exists: true } })
  .count()