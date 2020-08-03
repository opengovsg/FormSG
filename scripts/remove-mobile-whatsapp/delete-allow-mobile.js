/* eslint-disable */

/*
Delete allowMobile betaFlag for all users
*/

// Check total user count
db.getCollection('users').count()

// Check number of users with allowMobile flag
db.getCollection('users')
  .find({ 'betaFlags.allowMobile': { $exists: true } })
  .count()

// Delete allowMobile Flag
db.getCollection('users').updateMany({}, { $unset: { 'betaFlags.allowMobile': 1 } })

// Check number of users with allowMobile flag ~ Should be zero
db.getCollection('users')
  .find({ 'betaFlags.allowMobile': { $exists: true } })
  .count()

// Check total user count
db.getCollection('users').count()
