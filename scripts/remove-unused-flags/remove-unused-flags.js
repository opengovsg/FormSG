/* eslint-disable */

/*
Delete unused betaFlag (i.e. allowEncrypt, allowWebhook and allowVerifiedEmail) for all users
*/

// Check total user count
db.getCollection('users').count()

// Check number of users with allowEncrypt flag
db.getCollection('users')
  .find({ 'betaFlags.allowEncrypt': { $exists: true } })
  .count()

// Check number of users with allowWebhook flag
db.getCollection('users')
  .find({ 'betaFlags.allowWebhook': { $exists: true } })
  .count()

// Check number of users with allowVerifiedEmail flag
db.getCollection('users')
  .find({ 'betaFlags.allowVerifiedEmail': { $exists: true } })
  .count()


// !!!! MAIN UPDATE SCRIPT !!!!

// Delete unused allowEncrypt Flag ~ number updated should match number which had flag
db.getCollection('users').updateMany({}, {
  $unset: {
    'betaFlags.allowEncrypt': 1,
  }
})

// Delete unused allowWebhook Flag ~ number updated should match number which had flag
db.getCollection('users').updateMany({}, {
  $unset: {
    'betaFlags.allowWebhook': 1,
  }
})

// Delete unused allowVerifiedEmail Flag ~ number updated should match number which had flag
db.getCollection('users').updateMany({}, {
  $unset: {
    'betaFlags.allowVerifiedEmail': 1,
  }
})

// !!!! END MAIN UPDATE SCRIPT !!!!

// Check number of users with allowEncrypt flag ~ Should be zero
db.getCollection('users')
  .find({ 'betaFlags.allowEncrypt': { $exists: true } })
  .count()

// Check number of users with allowWebhook flag ~ Should be zero
db.getCollection('users')
  .find({ 'betaFlags.allowWebhook': { $exists: true } })
  .count()

// Check number of users with allowVerifiedEmail flag ~ Should be zero
db.getCollection('users')
  .find({ 'betaFlags.allowVerifiedEmail': { $exists: true } })
  .count()

// Check total user count
db.getCollection('users').count()