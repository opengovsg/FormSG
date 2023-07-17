/* eslint-disable */

// This script cleans up form_fields with hasAllowedEmailDomains = true but allowedEmailDomains is empty

// BEFORE
// count number of forms with form_fields where hasAllowedEmailDomains = true and allowedEmailDomains is empty

db.getCollection('forms').find({
  form_fields: {
    $elemMatch: {
      fieldType: 'email',
      hasAllowedEmailDomains: { $in: [true], $exists: true },
      allowedEmailDomains: { $eq: [], $exists: true },
    },
  },
})

// UPDATE
// Number of documents updated should match the count in BEFORE

db.getCollection('forms').updateMany(
  {
    form_fields: {
      $elemMatch: {
        fieldType: 'email',
        hasAllowedEmailDomains: { $in: [true], $exists: true },
        allowedEmailDomains: { $eq: [], $exists: true },
      },
    },
  },
  {
    $set: {
      'form_fields.$[elem].hasAllowedEmailDomains': false,
    },
  },
  {
    arrayFilters: [
      {
        'elem.fieldType': 'email',
        'elem.hasAllowedEmailDomains': { $in: [true], $exists: true },
        'elem.allowedEmailDomains': { $eq: [], $exists: true },
      },
    ],
    multi: true,
  },
)

// AFTER
// count number of forms with form_fields where hasAllowedEmailDomains = true and allowedEmailDomains is empty
// Expect 0

db.getCollection('forms').find({
  form_fields: {
    $elemMatch: {
      fieldType: 'email',
      hasAllowedEmailDomains: { $in: [true], $exists: true },
      allowedEmailDomains: { $eq: [], $exists: true },
    },
  },
})
