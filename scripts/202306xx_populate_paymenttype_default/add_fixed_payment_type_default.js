/* eslint-disable */

/*
Add PaymentType.Fixed to all forms with existing payments_field object
*/

// Batch 1 2022
const queriesModifiedIn2022 = {
  payments_field: { $exists: true },
  lastModified: { $gte: new ISODate('2022-01-01T00:00:00.000+0000') },
  lastModified: { $lt: new ISODate('2023-01-01T00:00:00.000+0000') },
}

const queriesModifiedIn2023Q1 = {
  lastModified: { $gte: new ISODate('2023-01-01T00:00:00.000+0000') },
  lastModified: { $lt: new ISODate('2023-04-01T00:00:00.000+0000') },
}

const queriesModifiedIn2023AprMay = {
  lastModified: { $gte: new ISODate('2023-04-01T00:00:00.000+0000') },
  lastModified: { $lt: new ISODate('2023-06-01T00:00:00.000+0000') },
}

const queriesModifiedIn2023JunOnwards = {
  lastModified: { $gte: new ISODate('2023-06-01T00:00:00.000+0000') },
}

function executePaymentTypeInsertionOnQuery(dateQuery, dryRun = true) {
  console.log(dateQuery)
  // Count number of forms that contains payments_field property
  const formsWithPaymentsField = db
    .getCollection('forms')
    .find({
      payments_field: { $exists: true },
      ...dateQuery,
    })
    .count()

  console.log('forms with payments_field', formsWithPaymentsField)

  // Count number of forms that contains payments_field.payment_type property.
  // Expected to be 0
  let formsWithPaymentType = db
    .getCollection('forms')
    .find({
      'payments_field.payment_type': { $exists: true },
      ...dateQuery,
    })
    .count()

  console.log('forms with payment_type', formsWithPaymentType)
  if (dryRun) {
    return
  }
  /*
Create payments_field.payment_type from existing payments_field
*/
  const updatedFields = db.getCollection('forms').updateMany(
    {
      payments_field: { $exists: true },
      ...dateQuery,
    },
    [
      {
        $set: {
          'payments_field.payment_type': 'Fixed',
        },
      },
    ],
  )
  console.log('updated fields', updatedFields)

  // Count number of forms that contains payments_field.payment_type property.
  // Expected to be equal to number of payment_field
  formsWithPaymentType = db
    .getCollection('forms')
    .find({
      'payments_field.payment_type': { $exists: true },
      ...dateQuery,
    })
    .count()
  console.log('forms with payment_type', formsWithPaymentType)
}

// executePaymentTypeInsertionOnQuery(queriesModifiedIn2022, false)
// executePaymentTypeInsertionOnQuery(queriesModifiedIn2023Q1, false)
// executePaymentTypeInsertionOnQuery(queriesModifiedIn2023AprMay, false)

// must be executed last
// executePaymentTypeInsertionOnQuery(queriesModifiedIn2023JunOnwards, false)
