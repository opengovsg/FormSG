/* eslint-disable */

/**
 * Add gstEnabled flag to payments and forms collections and set the 
 * gstEnabled flag for all documents to true
 */

// PAYMENTS COLLECTION
// BEFORE
// Count total number of payments with no gstEnabled flag. This should be 0.
db.getCollection('payments').countDocuments({ gstEnabled: { $size: 0 } }) === 0

// Count total number of payments.
const totalPayments = db.getCollection('payments').countDocuments({})

// Count total number of payments with no gstEnabled flag value. This should be equal to the total number of payments.
db
  .getCollection('payments')
  .countDocuments({ gstEnabled: { $exists: false } }) === totalPayments

// UPDATE
db.getCollection('payments').updateMany({}, [
  { $set: { gstEnabled: true } },
])

// AFTER
// Count total number of payments with gstEnabled flag value. This should be equal to the total number of payments.
db
  .getCollection('payments')
  .countDocuments({ gstEnabled: { $exists: true } }) === totalPayments

// Count total number of payments with no gstEnabled flag value. This should be equal to 0
db
  .getCollection('payments')
  .countDocuments({ gstEnabled: { $exists: false } }) === 0

  
// FORM COLLECTION
// BEFORE

// Count number of forms that contains the payments_field property
const totalPaymentForms = db.getCollection("forms").find(
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

