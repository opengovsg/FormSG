/* eslint-disable */

// BEFORE
// Count total number of these fields
{
  const ATTR_NAME = 'gradyear'
  const beforePipeline = [
    { $match: { form_fields: { $exists: true, $not: { $size: 0 } }, 'form_fields.myInfo.attr': ATTR_NAME } },
    { $project: { form_fields: 1 } },
    { $unwind: '$form_fields' },
    { $match: { 'form_fields.myInfo.attr': ATTR_NAME } },
    { $count: 'numFields' }
  ]
  db.forms.aggregate(beforePipeline)
}

// Count number of forms with this field
{
  const ATTR_NAME = 'gradyear'
  const pipeline = [
    { $match: { form_fields: { $exists: true, $not: { $size: 0 } }, 'form_fields.myInfo.attr': ATTR_NAME } },
    { $count: 'numForms' }
  ]
  db.forms.aggregate(pipeline)
}

// UPDATE
// Should be same as number of forms
{
  const ATTR_NAME = 'gradyear'
  const VALIDATION_OPTIONS = {
    customMax: 4,
    customMin: 4,
    customVal: 4,
    selectedValidation: 'Exact'
  }
  db.forms.updateMany(
    { form_fields: { $exists: true, $not: { $size: 0 } }, 'form_fields.myInfo.attr': ATTR_NAME },
    { $unset: { 'form_fields.$[field].myInfo': 1 }, $set: { 'form_fields.$[field].ValidationOptions': VALIDATION_OPTIONS } },
    { arrayFilters: [{ 'field.myInfo.attr': ATTR_NAME }] }
  )
}

// AFTER
// Ideally 0, unless someone has inserted a new field in between
{
  const ATTR_NAME = 'gradyear'
  const afterPipeline = [
    { $match: { form_fields: { $exists: true, $not: { $size: 0 } }, 'form_fields.myInfo.attr': ATTR_NAME } },
    { $project: { form_fields: 1 } },
    { $unwind: '$form_fields' },
    { $match: { 'form_fields.myInfo.attr': ATTR_NAME } },
    { $count: 'numFields' }
  ]
  db.forms.aggregate(afterPipeline)
}

// Count number of forms with this field
{
  const ATTR_NAME = 'gradyear'
  const pipeline = [
    { $match: { form_fields: { $exists: true, $not: { $size: 0 } }, 'form_fields.myInfo.attr': ATTR_NAME } },
    { $count: 'numForms' }
  ]
  db.forms.aggregate(pipeline)
}
