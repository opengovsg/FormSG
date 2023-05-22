/* eslint-disable */

// BEFORE
// Count total number of payments with no received webhooks. This should be 0.
db.getCollection('payments').countDocuments({ webhookLog: { $size: 0 } }) === 0

// Count total number of payments.
const total = db.getCollection('payments').countDocuments({})

// Count total number of payments with no targetAccountId value. This should be equal to the total number of payments.
db.getCollection('payments').countDocuments({ targetAccountId: { $exists: false } }) === total

// UPDATE
db.getCollection('payments').updateMany(
  {},
  [ { $set: { targetAccountId: { $first: '$webhookLog.account' } } } ],
)

// AFTER
// Count total number of payments with targetAccountId value. This should be equal to the total number of payments.
db.getCollection('payments').countDocuments({ targetAccountId: { $exists: true } }) === total

// Count total number of payments with no targetAccountId value. This should be equal to 0
db.getCollection('payments').countDocuments({ targetAccountId: { $exists: false } }) === 0
