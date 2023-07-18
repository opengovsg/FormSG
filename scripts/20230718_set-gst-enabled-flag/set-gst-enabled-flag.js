/* eslint-disable */

/**
 * This script adds the `gstEnabled` flag to the payments collection and sets the flag for all existing documents to true. 
 * It also adds the `gst_enabled` flag to the `payments_field` in the form collection, and sets the flag for all existing
 * documents with a `payments_field` to true. 
 */

// PAYMENTS COLLECTION
// BEFORE
// Count total number of payments.
db.getCollection('payments').countDocuments({})

// Count total number of payments with no gstEnabled flag value. This should be equal to the total number of payments.
db
  .getCollection('payments')
  .countDocuments({ gstEnabled: { $exists: false } })

// UPDATE
db.getCollection('payments').updateMany({}, [
  { $set: { gstEnabled: true } },
])

// AFTER
// Count total number of payments with gstEnabled flag value. This should be equal to the total number of payments.
db
  .getCollection('payments')
  .countDocuments({ gstEnabled: { $exists: true } })

// Count total number of payments with no gstEnabled flag value. This should be equal to 0
db
  .getCollection('payments')
  .countDocuments({ gstEnabled: { $exists: false } })


// FORM COLLECTION
// BEFORE

// Count number of forms that contains the payments_field property
db.getCollection("forms").find(
    {payments_field: {$ne: null }},
).count()

// Count total number of forms with no gstEnabled flag value. This should be equal to 0.
db.getCollection('forms')
  .find({ 'payments_field.gst_enabled': { $exists: true } })
  .count()

// UPDATE all forms (with payment fields) gst_enabled flag to true
db.getCollection('forms').updateMany({ payments_field: { $ne: null } },  [
  { $set: { payments_field: { gst_enabled: true } } },
])

// AFTER
// Count total number of forms with gstEnabled flag value. This should be equal to the total number of forms with payments_fields.
db.getCollection('forms')
  .find({ 'payments_field.gst_enabled': { $exists: true } })
  .count()

// Count total number of forms with payments_field property and no gstEnabled flag value. This should be equal to 0

db.getCollection('forms')
  .find({
    $and: [
      { payments_field: { $ne: null } },
      { payments_field: {gst_enabled: { $ne: null }} },
    ],
  })
  .count()

