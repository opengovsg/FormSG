/* eslint-disable */

/*
Add global beta collection to store global beta flags
*/

// Create globalBeta collection
db.createCollection('featureflags')

// Add payment beta flag and set enabled to true or false
// Upsert if not exist
db.featureflags.update(
  { name: 'payment' },
  {
    $setOnInsert: {
      enabled: false,
    },
  },
  { upsert: true },
)
