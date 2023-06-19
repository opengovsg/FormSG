/* eslint-disable */

/*
Add PaymentType.Fixed to all forms with existing payments_field object
*/

// Count number of forms that contains payments_field property
db.getCollection('forms')
  .find({ payments_field: { $exists: true } })
  .count()

// Count number of forms that contains payments_field.payment_type property.
// Expected to be 0
db.getCollection('forms')
  .find({ "payments_field.payment_type": { $exists: true } })
  .count()

/*
Create payments_field.payment_type from existing payments_fields
*/
db.getCollection('forms').updateMany({ payments_field: { $exists: true } }, [
  {
    $set: {
      "payments_field.payment_type": "Fixed"
    },
  },
])

// Count number of forms that contains payments_field.payment_type property.
// Expected to be equal to number of payment_fields
db.getCollection('forms')
  .find({ "payments_field.payment_type": { $exists: true } })
  .count()
  