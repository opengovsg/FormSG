/* eslint-disable */

/*
Delete unused customLogo key for all forms
*/

// Check total forms count
db.getCollection('forms').count() 

// Check number of forms with customLogo key
db.getCollection('forms').find({ customLogo: { $exists: true } }).count()

// Check number of forms with startPage.logo key
db.getCollection('forms').find({ "startPage.logo.state": { $exists: true } }).count()

// !!!! MAIN UPDATE SCRIPT !!!!

// Delete unused customLogo key
// ~ number updated should match number which had key
db.getCollection('forms').updateMany({}, {
  $unset: {
    'customLogo': 1,
  }
})

// !!!! END MAIN UPDATE SCRIPT !!!!

// Check total forms count
// ~ Should be same as before
db.getCollection('forms').count()

// Check number of forms with customLogo key
// ~ Should be zero
db.getCollection('forms').find({ customLogo: { $exists: true } }).count()

// Check number of forms with startPage.logo key
// ~ Number should be the same as before
db.getCollection('forms').find({ "startPage.logo.state": { $exists: true } }).count()