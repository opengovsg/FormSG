/* eslint-disable */

/*
Delete unused betaFlag (i.e. allowSms) for all users
*/

// Check total user count
db.getCollection('users').count()

// Check number of users with allowSms flag
db.getCollection('users')
  .find({ 'betaFlags.allowSms': { $exists: true } })
  .count()

// Delete unused allowSms Flag ~ number updated should match number which had flag
db.getCollection('users').updateMany({}, {
  $unset: {
    'betaFlags.allowSms': 1,
  }
})

// Check total user count
db.getCollection('users').count()

// Check number of users with allowSms flag ~ Should be zero
db.getCollection('users')
  .find({ 'betaFlags.allowSms': { $exists: true } })
  .count()