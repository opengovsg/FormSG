/* eslint-disable */

/*
Delete endPage.buttons key from old form documents in the database
*/

// == PRE-UPDATE CHECKS ==

// Count number of forms with endPage buttons key
db.getCollection('forms').count({ "endPage.buttons": { $exists: true } })

// == UPDATE ==
// Delete endPage buttons key
// ~ Number of forms updated should match number which had endPage buttons key
db.getCollection('forms').updateMany({}, {
  $unset: {
    'endPage.buttons': "",
  }
})

// == POST-UPDATE CHECKS ==

// Check number of forms with endPage buttons key
// ~ Should be zero
db.getCollection('forms').count({ "endPage.buttons": { $exists: true } })