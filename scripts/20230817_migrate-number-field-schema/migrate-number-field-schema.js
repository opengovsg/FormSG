/* eslint-disable */

// This script migrates the existing NumberFieldSchema.ValidationOptions to
// the new NumberFieldSchema.ValidationOptions.LengthValidationOptions

// BEFORE
// COUNT existing number of forms with the old number field schema
db.forms.countDocuments({
  form_fields: {
    $elemMatch: {
      fieldType: 'number',
      'ValidationOptions.customVal': {
        $exists: true,
      },
    },
  },
})

// UPDATE
// modifiedCount should match COUNT in BEFORE
db.forms.updateMany(
  {
    form_fields: {
      $elemMatch: {
        fieldType: 'number',
        'ValidationOptions.customVal': {
          $exists: true,
        },
      },
    },
  },
  [
    {
      $set: {
        form_fields: {
          $map: {
            input: '$form_fields',
            as: 'field',
            in: {
              $cond: {
                if: {
                  $eq: ['$$field.fieldType', 'number'],
                },
                then: {
                  $mergeObjects: [
                    '$$field',
                    {
                      ValidationOptions: {
                        selectedValidation: {
                          $cond: {
                            if: {
                              $ne: [
                                '$$field.ValidationOptions.selectedValidation',
                                null,
                              ],
                            },
                            then: 'Length',
                            else: null,
                          },
                        },
                        LengthValidationOptions: {
                          selectedLengthValidation:
                            '$$field.ValidationOptions.selectedValidation',
                          customVal: '$$field.ValidationOptions.customVal',
                        },
                        RangeValidationOptions: {
                          customMin: null,
                          customMax: null,
                        },
                      },
                    },
                  ],
                },
                else: '$$field',
              },
            },
          },
        },
      },
    },
  ],
)

// AFTER
// Count number of forms with old number field schema
// Expect 0

db.forms.countDocuments({
  form_fields: {
    $elemMatch: {
      fieldType: 'number',
      'ValidationOptions.customVal': {
        $exists: true,
      },
    },
  },
})
