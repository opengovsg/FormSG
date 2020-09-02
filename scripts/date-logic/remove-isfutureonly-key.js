/* eslint-disable */

// Number of forms with isFutureOnly key - expect 0 after running update

db.forms.count({
  form_fields: { $elemMatch: { isFutureOnly: { $exists: true } } },
})

// Number of form fields with isFutureOnly key - expect 0 after running update

const formFieldsWithIsFutureOnlyExist = [
  {
    $match: {
      form_fields: { $elemMatch: { isFutureOnly: { $exists: true } } },
    },
  },
  { $project: { form_fields: 1 } },
  { $unwind: '$form_fields' },
  { $match: { 'form_fields.isFutureOnly': { $exists: true } } },
  { $count: 'numFormFields' },
]

db.getCollection('forms').aggregate(formFieldsWithIsFutureOnlyExist)

// Update - Remove isFutureOnly key

db.forms.update(
  { 'form_fields.isFutureOnly': { $exists: true } },
  { $unset: { 'form_fields.$[elem].isFutureOnly': '' } },
  { arrayFilters: [{ 'elem.isFutureOnly': { $exists: true } }], multi: true },
)
