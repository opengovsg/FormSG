/* eslint-disable */

/** What: This script sets isSubmitterIdCollectionEnabled to true for all existing forms 
 * where isSubmitterIdCollectionEnabled does not exist. 
 * Why: This was done so as to maintain the existing behaviour of the forms where 
 * nric/fin/uen is collected for all Singpass forms before the addition of Singpass 
 * Id Collection Opt-in/out feature added in https://github.com/opengovsg/FormSG/pull/7566. 
*/

// COUNT # total number of forms
db.forms.countDocuments()

// STEP 1: set isSubmitterIdCollectionEnabled to true for all existing forms where isSubmitterIdCollectionEnabled does not exist
// COUNT 
// # forms where isSubmitterIdCollectionEnabled does not exist, which is # of forms to update
db.forms.countDocuments({
  isSubmitterIdCollectionEnabled: { $exists: false },
})

// UPDATE
// Set isSubmitterIdCollectionEnabled: true for forms where isSubmitterIdCollectionEnabled does not exist
db.forms.updateMany(
  {   
    // Used for updating the forms in batches by created timestamp 
    created: {
      $gte: ISODate(
        "2023-01-01T00:00:00.000+00:00"
      ),
      $lte: ISODate("2024-01-01T00:00:00.000+00:00")
    }, 
    isSubmitterIdCollectionEnabled: { $exists: false } }, 
  { $set: { isSubmitterIdCollectionEnabled: true } }, 
)

// VERIFY 
// Ensure # forms where isSubmitterIdCollectionEnabled does not exist = 0
db.forms.countDocuments({
  isSubmitterIdCollectionEnabled: { $exists: false },
})