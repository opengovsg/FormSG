/* eslint-disable */
/**
 * This script converts the all instances where the `payment_fields_snapshot` field is an array to an object
 */

// PAYMENTS COLLECTION
// BEFORE
// Count total number of payments.
db.getCollection('payments').countDocuments({})

// Count total number of payments where the payment_fields_snapshot is an array
db.getCollection('payments').countDocuments({
  payment_fields_snapshot: { $type: 'array' },
})


// UPDATE
db.getCollection('payments').aggregate([
  {
    $match: {
      payment_fields_snapshot: { $type: 'array' },
    },
  },
  {
    $lookup: {
      from: 'forms',
      localField: 'formId',
      foreignField: '_id',
      as: 'form',
    },
  },
  {
    $set: {
      payment_fields_snapshot: {
        $reduce: {
          input: '$form.payments_field',
          initialValue: {},
          in: { $mergeObjects: ['$$value', '$$this'] },
        },
      },
    },
  },
  { $project: { form: 0 } },
  {
    $merge: {
      into: 'payments',
      on: '_id',
      whenMatched: 'replace',
    },
  },
])

// AFTER
// Count total number of payments where the payment_fields_snapshot is an array. This should be equal to 0
db.getCollection('payments').countDocuments({
  payment_fields_snapshot: { $type: 'array' },
})

// Count total number of payments with payment_fields_snapshot value. This should be equal to the total number of payments.
db.getCollection('payments').countDocuments({
  payment_fields_snapshot: { $exists: true },
})
