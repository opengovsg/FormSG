/* eslint-disable */
/**
 * This script adds the `payment_fields_snapshot` field to the payments collection and sets the field
 * as the form document's payment_field for all existing documents.
 */

// PAYMENTS COLLECTION
// BEFORE
// Count total number of payments.
db.getCollection('payments').countDocuments({})

// Count total number of payments with no payment_fields_snapshot value. This should be equal to the total number of payments.
db.getCollection('payments').countDocuments({
  payment_fields_snapshot: { $exists: false },
})

// UPDATE
db.getCollection('payments').aggregate([
  {
    $lookup: {
      from: 'forms',
      localField: 'formId',
      foreignField: '_id',
      as: 'form',
    },
  },
  { $set: { payment_fields_snapshot: '$form.payments_field' } },
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
// Count total number of payments with payment_fields_snapshot value. This should be equal to the total number of payments.
db.getCollection('payments').countDocuments({
  payment_fields_snapshot: { $exists: true },
})

// Count total number of payments with no payment_fields_snapshot value. This should be equal to 0
db.getCollection('payments').countDocuments({
  payment_fields_snapshot: { $exists: false },
})
