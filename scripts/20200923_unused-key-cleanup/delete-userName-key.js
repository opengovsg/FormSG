/* eslint-disable */

/*
Delete unused keys for all logins
*/

// Check total login count
db.getCollection('logins').count()

// Check number of logins with userName flag
db.getCollection('logins')
  .find({ 'userName': { $exists: true } })
  .count()

// !!!! MAIN UPDATE SCRIPT !!!!

// Delete unused userName key ~ number updated should match number which had key
db.getCollection('logins').updateMany({}, {
  $unset: {
    'userName': 1,
  }
})

// !!!! END MAIN UPDATE SCRIPT !!!!

// Check number of logins with userName flag ~ Should be zero
db.getCollection('logins')
  .find({ 'userName': { $exists: true } })
  .count()

// Check total login count
db.getCollection('logins').count()