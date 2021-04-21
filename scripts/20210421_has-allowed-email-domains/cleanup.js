/* eslint-disable */

// Optional: Retrieve forms with fields that has a populated allowedEmailDomains but has no allowed email domains.
db.getCollection('forms').aggregate([
  { $unwind: '$form_fields' },
  {
    $match: {
      'form_fields.fieldType': 'email',
      'form_fields.hasAllowedEmailDomains': false,
      'form_fields.allowedEmailDomains': { $ne: [] },
    },
  },
  {
    $group: {
      _id: '$_id',
      form_fields: { $addToSet: '$form_fields' },
    },
  }
])

// Retrieve counts of various form states
// Count forms with email fields isVerifiable=true, hasAllowedEmailDomains=true, non-empty allowedEmailDomains
// Basically forms with restricted domain email fields

// COUNT_A =

db.getCollection('forms').count({
  'form_fields.fieldType': 'email',
  'form_fields.isVerifiable': true,
  'form_fields.hasAllowedEmailDomains': true,
  'form_fields.allowedEmailDomains': { $ne: [] },
})

// Count forms with isVerifiable=true, but hasAllowedEmailDomains=false
// Basically forms with verification but not restrictions

// COUNT_B = 

db.getCollection('forms').count({
  'form_fields.fieldType': 'email',
  'form_fields.isVerifiable': true,
  'form_fields.hasAllowedEmailDomains': false,
})

// Count forms with non-empty allowed email domains even if hasAllowedEmailDomains is false, 
// so we can reset array before removing hasAllowedEmailDomains key.

// COUNT_C = 

db.getCollection('forms').count({
  'form_fields.fieldType': 'email',
  'form_fields.hasAllowedEmailDomains': false,
  'form_fields.allowedEmailDomains': { $ne: [] },
})

// Count forms with inconsistent email states
// hasAllowedEmailDomains = true but allowedEmailDomains is empty
// Should not matter since allowedEmailDomains is the source of truth

// COUNT_D = 

db.getCollection('forms').count({
  'form_fields.fieldType': 'email',
  'form_fields.hasAllowedEmailDomains': true,
  'form_fields.allowedEmailDomains': { $eq: [] },
})


// !!! Main update !!!
// Set all current fields with hasAllowedEmailDomains = false to empty allowedEmailDomains array [] and remove hasAllowedEmailDomains key.
// updateCount should be === COUNT_C
// updateCount = 

db.getCollection('forms').updateMany(
  {
    'form_fields.fieldType': 'email',
    'form_fields.hasAllowedEmailDomains': false,
    'form_fields.allowedEmailDomains': { $ne: [] },
  },
  {
    $set: {
      'form_fields.$[elem].allowedEmailDomains': [],
    },
    $unset: {
      'form_fields.$[elem].hasAllowedEmailDomains': 1,
    }
  },
  {
    arrayFilters: [
      {
        'elem.fieldType': 'email',
        'elem.hasAllowedEmailDomains': false,
        'elem.allowedEmailDomains': { $ne: [] },
      },
    ],
    multi: true,
  }
)

// Should now have 0 non-empty domains if hasAllowedEmailDomains is false
db.getCollection('forms').count({
  'form_fields.fieldType': 'email',
  'form_fields.hasAllowedEmailDomains': false,
  'form_fields.allowedEmailDomains': { $ne: [] },
})

// Retrieve remaining email fields with hasAllowedEmailDomains key

// COUNT_D = 

db.getCollection('forms').count({
  'form_fields.fieldType': 'email',
  'form_fields.hasAllowedEmailDomains': { $exists: true },
})

// !!! Secondary update to remove hasAllowedEmailDomains key
// updateCount sohuld === COUNT_D
// updateCount =
db.getCollection('forms').updateMany(
  {
    'form_fields.fieldType': 'email',
    'form_fields.hasAllowedEmailDomains': { $exists: true },
  },
  {
    $unset: {
      'form_fields.$[elem].hasAllowedEmailDomains': 1,
    },
  },
  {
    arrayFilters: [
      {
        'elem.fieldType': 'email',
        'elem.hasAllowedEmailDomains': { $exists: true },
      },
    ],
    multi: true,
  }
)

// Should be 0
db.getCollection('forms').count({
  'form_fields.fieldType': 'email',
  'form_fields.hasAllowedEmailDomains': { $exists: true },
})

// !!! Verification checks
// Retrieve final counts of fields with isVerifiable=true and non-empty allowedEmailDomains
// finalCount should === COUNT_A

// finalCount = 

db.getCollection('forms').count({
  'form_fields.fieldType': 'email',
  'form_fields.isVerifiable': true,
  'form_fields.allowedEmailDomains': { $ne: [] },
})

// Retrieve final counts of fields with isVerifiable but empty allowedEmailDomains
// finalCount should === COUNT_B

// finalCount = 

db.getCollection('forms').count({
  'form_fields.fieldType': 'email',
  'form_fields.isVerifiable': true,
  'form_fields.allowedEmailDomains': { $eq: [] },
})
