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

// # of documents with encryptionBoundaryShift set to true
const docsSetToTrueBefore = formsCollection.countDocuments({ encryptionBoundaryShift: true })
console.log('# of documents with encryptionBoundaryShift set true:', docsSetToTrueBefore);

// # of documents to modify
console.log('# of documents to modify:', totalDocs - docsSetToTrueBefore);


// set documents
formsCollection.updateMany(
  {},
  {
    $set: { encryptionBoundaryShift: true }
  }
);

console.log('=== after ===')

// # of documents with encryptionBoundaryShift set to true (should match # of documents to modify)
const docsSetToTrueAfter = formsCollection.countDocuments({ encryptionBoundaryShift: true })
console.log('# of documents with encryptionBoundaryShift set true:', docsSetToTrueAfter);

// # of documents to modify
console.log('# of documents left:', totalDocs - docsSetToTrueAfter);

session.abortTransaction();
// session.commitTransaction();

session.endSession();
