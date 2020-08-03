/* eslint-disable */

// This is the code to backfill the version of the encrypted content in
// submissions of encrypted forms.

// Get count of all encrypted submissions
db.getCollection('submissions').find({ submissionType: 'encryptSubmission' })
  .count()

// Get count of all encrypted submissions without version number
// SHOULD BE EQUAL TO NUMBER OF ALL ENCRYPTED SUBMISSIONS!!!!
db.getCollection('submissions').find({ submissionType: 'encryptSubmission', version: { $exists: false } })
  .count()

// Set all encrypted submissions to have a version of 1
db.getCollection('submissions').update({ submissionType: 'encryptSubmission' }, {
  $set: {
    version: 1,
  },
}, {
  multi: true,
})

// Get count of all encrypted submissions without version number
// SHOULD BE 0!!!!
db.getCollection('submissions').find({ submissionType: 'encryptSubmission', version: { $exists: false } })
  .count()
  // Get count of all encrypted submissions with version number
// SHOULD NOW BE EQUAL TO NUMBER OF ALL ENCRYPTED SUBMISSIONS!!!!
db.getCollection('submissions').find({ submissionType: 'encryptSubmission', version: 1 })
  .count()
