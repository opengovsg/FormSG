/* eslint-disable */

/*
Delete unused keys for all formfeedback
*/

// Check total formfeedback count
db.getCollection('formfeedback').count()

// Check number of formfeedback with agency flag
db.getCollection('formfeedback')
  .find({ 'agency': { $exists: true } })
  .count()

// !!!! MAIN UPDATE SCRIPT !!!!

// Delete unused agency key ~ number updated should match number which had key
db.getCollection('formfeedback').updateMany({}, {
  $unset: {
    'agency': 1,
  }
})

// !!!! END MAIN UPDATE SCRIPT !!!!

// Check number of formfeedback with agency flag ~ Should be zero
db.getCollection('formfeedback')
  .find({ 'agency': { $exists: true } })
  .count()

// Check total formfeedback count
db.getCollection('formfeedback').count()