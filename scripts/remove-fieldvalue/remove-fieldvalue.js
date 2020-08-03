/* eslint-disable */

// BEFORE
// Total number of form fields
const beforePipelineAllFields = [
  { '$project': { 'form_fields': 1 } },
  { '$unwind': '$form_fields' },
  { '$count': 'numFormFields' }
]
db.getCollection('forms').aggregate(beforePipelineAllFields)

// Total number of form fields with fieldValue
const beforePipelineWithFieldValue = [
  { '$match': { 'form_fields': { '$elemMatch': { 'fieldValue': { '$exists': true } } } } },
  { '$project': { 'form_fields': 1 } },
  { '$unwind': '$form_fields' },
  { '$match': { 'form_fields.fieldValue': { '$exists': true } } },
  { '$count': 'numFormFields' }
]
db.getCollection('forms').aggregate(beforePipelineWithFieldValue)

// UPDATE
db.getCollection('forms').update(
  { 'form_fields': { '$exists': true } },
  { '$unset': { 'form_fields.$[].fieldValue': '' } },
  { 'multi': true }
)

// AFTER
// Total number of form fields with fieldValue - ideally should be 0, but may not be if there were
// fields added in between while the old server is running.
const afterPipelineWithFieldValue = [
  { '$match': { 'form_fields': { '$elemMatch': { 'fieldValue': { '$exists': true } } } } },
  { '$project': { 'form_fields': 1 } },
  { '$unwind': '$form_fields' },
  { '$match': { 'form_fields.fieldValue': { '$exists': true } } },
  { '$count': 'numFormFields' }
]
db.getCollection('forms').aggregate(afterPipelineWithFieldValue)

// Total number of form fields without fieldValue - ideally should be equal to total number
// of form fields from before.
const afterPipelineNoFieldValue = [
  { '$match': { 'form_fields': { '$elemMatch': { 'fieldValue': { '$exists': false } } } } },
  { '$project': { 'form_fields': 1 } },
  { '$unwind': '$form_fields' },
  { '$match': { 'form_fields.fieldValue': { '$exists': false } } },
  { '$count': 'numFormFields' }
]
db.getCollection('forms').aggregate(afterPipelineNoFieldValue)

// Total number of form fields - ideally the same as in the previous step.
const afterPipelineAllFields = [
  { '$project': { 'form_fields': 1 } },
  { '$unwind': '$form_fields' },
  { '$count': 'numFormFields' }
]
db.getCollection('forms').aggregate(afterPipelineAllFields)