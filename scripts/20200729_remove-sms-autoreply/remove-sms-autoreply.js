/* eslint-disable */

// This is the code to remove the `smsReplyOptions` key in `mobile` form fields.

// Total number of mobile form fields
const beforePipelineMobileFields = [
  { $match: { form_fields: { $elemMatch: { fieldType: 'mobile' } } } },
  { $project: { form_fields: 1 } },
  { $unwind: '$form_fields' },
  { $match: { 'form_fields.fieldType': 'mobile' } },
  { $count: 'numFormFields' }
]
db.getCollection('forms').aggregate(beforePipelineMobileFields)

// Fields with smsReplyOptions, should be same as number of mobile fields 
// (or slightly less, some if users on the new client has added mobile fields
// after running first check and before this check)
const beforePipelineReplyOptions = [
  {
    $match: {
      form_fields: { $elemMatch: { smsReplyOptions: { $exists: true } } },
    },
  },
  { $project: { form_fields: 1 } },
  { $unwind: '$form_fields' },
  { $match: { 'form_fields.smsReplyOptions': { $exists: true } } },
  { $count: 'numFormFields' }
]
db.getCollection('forms').aggregate(beforePipelineReplyOptions)

// UPDATE
// Remove smsReplyOptions from form fields that have it
db.getCollection('forms').update(
  { 'form_fields.smsReplyOptions': { $exists: true } },
  { $unset: { 'form_fields.$[].smsReplyOptions': '' } },
  { multi: true }
)

// After checks

// Number of mobile fields should be same as start (or slightly higher if admins
// hadded more fields)
const afterPipelineMobileFields = [
  { $match: { form_fields: { $elemMatch: { fieldType: 'mobile' } } } },
  { $project: { form_fields: 1 } },
  { $unwind: '$form_fields' },
  { $match: { 'form_fields.fieldType': 'mobile' } },
  { $count: 'numFormFields' }
]
db.getCollection('forms').aggregate(afterPipelineMobileFields)

// Number of fields with smsReplyOptions should be ZERO
const afterPipelineReplyOptions = [
  {
    $match: {
      form_fields: { $elemMatch: { smsReplyOptions: { $exists: true } } },
    },
  },
  { $project: { form_fields: 1 } },
  { $unwind: '$form_fields' },
  { $match: { 'form_fields.smsReplyOptions': { $exists: true } } },
  { $count: 'numFormFields' }
]
db.getCollection('forms').aggregate(afterPipelineReplyOptions)
