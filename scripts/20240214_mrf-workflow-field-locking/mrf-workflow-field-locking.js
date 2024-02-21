/* eslint-disable */

// This script migrates the existing workflow options for multirespondent forms
// to include a new field "edit", which will contain the list of field IDs to be
// edited by the respondent at each stage.

// BEFORE
// COUNT existing number of forms with non-empty workflows in total
db.forms.countDocuments({
  responseMode: 'multirespondent',
  workflow: { $exists: true, $type: 'array', $gt: { $size: 0 } },
})

// UPDATE
// modifiedCount should match COUNT in BEFORE
db.forms.updateMany(
  {
    responseMode: 'multirespondent',
    workflow: { $exists: true, $type: 'array' },
  },
  [
    {
      $addFields: {
        'workflow.edit': {
          $map: {
            input: {
              $filter: {
                input: '$form_fields',
                as: 'field',
                cond: {
                  $and: [
                    { $ne: ['$$field.fieldType', 'section'] },
                    { $ne: ['$$field.fieldType', 'statement'] },
                    { $ne: ['$$field.fieldType', 'image'] },
                  ],
                },
              },
            },
            as: 'field',
            in: '$$field._id',
          },
        },
      },
    },
  ],
)
