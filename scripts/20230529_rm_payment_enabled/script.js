/* eslint-disable */

// BEFORE
// Count total number of forms with payment_fields that have enabled value. This should be > 0.
db.getCollection('forms').countDocuments({ "payments_field.enabled": { $exists: true } })

// UPDATE - remove payments_field.enabled
db.getCollection('forms').updateMany(
  {},
  [ { $unset: { "payments_field.enabled": true } } ],
)

// AFTER
// Count total number of forms with payment_fields that have enabled value. This should be 0.
db.getCollection('forms').countDocuments({ "payments_field.enabled": { $exists: true } }) === 0
