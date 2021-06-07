/* eslint-disable */

/*
Delete endPage.buttons key from old form documents in the database
*/

// == PRE-UPDATE CHECKS ==

// Count total number of forms
db.getCollection('forms').count() 

// Count number of forms with endPage buttons key
db.getCollection('forms').find({ "endPage.buttons": { $exists: true } }).count()


// == UPDATE ==
// Delete endPage buttons key
// ~ Number of forms updated should match number which had endPage buttons key
db.getCollection('forms').updateMany({}, {
  $unset: {
    'endPage.buttons': "",
  }
})

// == POST-UPDATE CHECKS ==

// Check total forms count
// ~ Should be same as before
db.getCollection('forms').count()

// Check number of forms with endPage buttons key
// ~ Should be zero
db.getCollection('forms').find({ "endPage.buttons": { $exists: true } }).count()