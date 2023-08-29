/* eslint-disable */
/**
 * This script sets encryptionBoundaryShift flag for all forms to true.
 * A session is used to dry run the update operation before committing the changes.
 */

// Start a session.
session = db.getMongo().startSession( { readPreference: { mode: "primary" } } );

// Start a transaction
session.startTransaction( { readConcern: { level: "local" }, writeConcern: { w: "majority" } } );

formsCollection = session.getDatabase("formsg").forms;

console.log('=== before ===')

// total # of documents
const totalDocs = formsCollection.countDocuments()
console.log('total # of documents:', totalDocs);

// # of documents with encryptionBoundaryShift set
const docsSetBefore = formsCollection.countDocuments({ encryptionBoundaryShift: { $exists: true } })
console.log('# of documents with encryptionBoundaryShift set:', docsSetBefore);


// set documents
formsCollection.updateMany(
  {},
  {
    $unset: { encryptionBoundaryShift: true }
  }
);

console.log('=== after ===')

// # of documents with encryptionBoundaryShift set to true (should match # of documents to modify)
const docsSetAfter = formsCollection.countDocuments({ encryptionBoundaryShift: { $exists: true } })
console.log('# of documents with encryptionBoundaryShift set:', docsSetAfter);

session.abortTransaction();
// session.commitTransaction();

session.endSession();
