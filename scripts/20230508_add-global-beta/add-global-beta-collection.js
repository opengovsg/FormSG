/* eslint-disable */

/*
Add global beta collection to store global beta flags
*/

// Create globalBeta collection
db.createCollection('globalBeta')

// Add payment beta flag and set enabled to true or false
// Upsert if not exist
db.globalBeta.update(
  { name: 'payment' },
  {
    $setOnInsert: {
      enabled: false,
    },
  },
  { upsert: true },
)
