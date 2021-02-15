/* eslint-disable */

// BEFORE
// Count total number of these fields
{
  const ATTR_NAME = 'edulevel'
  const pipeline = [
    { $match: { form_fields: { $exists: true, $not: { $size: 0 } }, 'form_fields.myInfo.attr': ATTR_NAME } },
    { $project: { form_fields: 1 } },
    { $unwind: '$form_fields' },
    { $match: { 'form_fields.myInfo.attr': ATTR_NAME } },
    { $count: 'numFields' }
  ]
  db.forms.aggregate(pipeline)
}

// Count number of forms with this field
{
  const ATTR_NAME = 'edulevel'
  const pipeline = [
    { $match: { form_fields: { $exists: true, $not: { $size: 0 } }, 'form_fields.myInfo.attr': ATTR_NAME } },
    { $count: 'numForms' }
  ]
  db.forms.aggregate(pipeline)
}

// UPDATE
// Should be same as number of forms
{
  const ATTR_NAME = 'edulevel'
  const FIELD_OPTIONS = [
    'NO FORMAL QUALIFICATION / PRE-PRIMARY / LOWER PRIMARY',
    'PRIMARY',
    'LOWER SECONDARY',
    'SECONDARY',
    'POST-SECONDARY (NON-TERTIARY): GENERAL & VOCATION',
    'POLYTECHNIC DIPLOMA',
    'PROFESSIONAL QUALIFICATION AND OTHER DIPLOMA',
    "BACHELOR'S OR EQUIVALENT",
    "POSTGRADUATE DIPLOMA / CERTIFICATE (EXCLUDING MASTER'S AND DOCTORATE)",
    "MASTER'S AND DOCTORATE OR EQUIVALENT",
    'MODULAR CERTIFICATION (NON-AWARD COURSES / NON-FULL QUALIFICATIONS)'
  ]
  db.forms.updateMany(
    { form_fields: { $exists: true, $not: { $size: 0 } }, 'form_fields.myInfo.attr': ATTR_NAME },
    { $unset: { 'form_fields.$[field].myInfo': 1 }, $set: { 'form_fields.$[field].fieldOptions': FIELD_OPTIONS } },
    { arrayFilters: [{ 'field.myInfo.attr': ATTR_NAME }] }
  )
}

// AFTER
// Ideally 0, unless someone has inserted a new field in between
{
  const ATTR_NAME = 'edulevel'
  const pipeline = [
    { $match: { form_fields: { $exists: true, $not: { $size: 0 } }, 'form_fields.myInfo.attr': ATTR_NAME } },
    { $project: { form_fields: 1 } },
    { $unwind: '$form_fields' },
    { $match: { 'form_fields.myInfo.attr': ATTR_NAME } },
    { $count: 'numFields' }
  ]
  db.forms.aggregate(pipeline)
}

// Count number of forms with this field
{
  const ATTR_NAME = 'edulevel'
  const pipeline = [
    { $match: { form_fields: { $exists: true, $not: { $size: 0 } }, 'form_fields.myInfo.attr': ATTR_NAME } },
    { $count: 'numForms' }
  ]
  db.forms.aggregate(pipeline)
}
