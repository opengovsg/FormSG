/* eslint-disable */
// Scripts for #408

/**
 * Part 1: Verify that the database is internally consistent today
 * for all short text, long text and number fields.
 * Expect 0 records for all scripts
 */

// a. customVal === customMin when selectedValidation === 'Minimum'
// Expect 0 records

db.getCollection('forms').aggregate([
  {
    $match: {
      'form_fields': {$elemMatch: {'fieldType': { $in: ['textfield', 'textarea', 'number'] }}},
    },
  },
  { $unwind: '$form_fields' },
  {
    $match: {
      'form_fields.fieldType': { $in: ['textfield', 'textarea', 'number'] },
    },
  },
  {
    $project: {
      form_fields: 1,
      selectedValidation: '$form_fields.ValidationOptions.selectedValidation',
      customVal: '$form_fields.ValidationOptions.customVal',
      customMin: '$form_fields.ValidationOptions.customMin',
      customMax: '$form_fields.ValidationOptions.customMax',
    },
  },
  {
    $match: {
      $and: [
        {
          selectedValidation: 'Minimum',
        },
        {
          $expr: { $ne: ['$customMin', '$customVal'] },
        },
      ],
    },
  },
])

// b. customVal === customMax when selectedValidation === 'Maximum'
// Expect 0 records

db.getCollection('forms').aggregate([
  {
    $match: {
      'form_fields': {$elemMatch: {'fieldType': { $in: ['textfield', 'textarea', 'number'] }}},
    },
  },
  { $unwind: '$form_fields' },
  {
    $match: {
      'form_fields.fieldType': { $in: ['textfield', 'textarea', 'number'] },
    },
  },
  {
    $project: {
      form_fields: 1,
      selectedValidation: '$form_fields.ValidationOptions.selectedValidation',
      customVal: '$form_fields.ValidationOptions.customVal',
      customMin: '$form_fields.ValidationOptions.customMin',
      customMax: '$form_fields.ValidationOptions.customMax',
    },
  },
  {
    $match: {
      $and: [
        {
          selectedValidation: 'Maximum',
        },
        {
          $expr: { $ne: ['$customMax', '$customVal'] },
        },
      ],
    },
  },
])

// c. customVal === customMin === customMax when selectedValidation === 'Exact'
// Expect 0 records

db.getCollection('forms').aggregate([
  {
    $match: {
      'form_fields': {$elemMatch: {'fieldType': { $in: ['textfield', 'textarea', 'number'] }}},
    },
  },
  { $unwind: '$form_fields' },
  {
    $match: {
      'form_fields.fieldType': { $in: ['textfield', 'textarea', 'number'] },
    },
  },
  {
    $project: {
      form_fields: 1,
      selectedValidation: '$form_fields.ValidationOptions.selectedValidation',
      customVal: '$form_fields.ValidationOptions.customVal',
      customMin: '$form_fields.ValidationOptions.customMin',
      customMax: '$form_fields.ValidationOptions.customMax',
    },
  },
  {
    $match: {
      $and: [
        {
          selectedValidation: 'Exact',
        },
        {
          $or: [
            {
              $expr: { $ne: ['$customMax', '$customVal'] },
            },
            {
              $expr: { $ne: ['$customMin', '$customVal'] },
            },
          ],
        },
      ],
    },
  },
])

// d. selectedValidation === 'Range' should not exist
// Expect 0 records

db.getCollection('forms').aggregate([
  {
    $match: {
      'form_fields': {$elemMatch: {'fieldType': { $in: ['textfield', 'textarea', 'number'] }}},
    },
  },
  { $unwind: '$form_fields' },
  {
    $match: {
      'form_fields.fieldType': { $in: ['textfield', 'textarea', 'number'] },
    },
  },
  {
    $project: {
      form_fields: 1,
      selectedValidation: '$form_fields.ValidationOptions.selectedValidation',
    },
  },
  {
    $match: {
      selectedValidation: 'Range',
    },
  },
])

/**
 * Part 2: Unset form_fields.ValidationOptions.customMin and
 * form_fields.ValidationOptions.customMax
 * for all short text, long text and number fields.
 */

// ********** BEFORE **********

// Count number of forms with (short text, long text and number fields) and
// with ValidationOptions.customMin
// Should match number of updated records later

db.forms.count({
  form_fields: {
    $elemMatch: {
      $and: [
        {
          fieldType: { $in: ['textfield', 'textarea', 'number'] },
        },
        { 'ValidationOptions.customMin': { $exists: true } },
      ],
    },
  },
})

// Count number of forms with (short text, long text and number fields) and
// with ValidationOptions.customMax
// Should match number of updated records later

db.forms.count({
  form_fields: {
    $elemMatch: {
      $and: [
        {
          fieldType: { $in: ['textfield', 'textarea', 'number'] },
        },
        { 'ValidationOptions.customMax': { $exists: true } },
      ],
    },
  },
})

// Count number of form FIELDS which are NOT (short text, long text and number fields) and
// with ValidationOptions.customMin
// Expect unchanged after update

db.forms.aggregate([
  { $unwind: '$form_fields' },
  {
    $match: {
      'form_fields.fieldType': { $nin: ['textfield', 'textarea', 'number'] },
    },
  },
  {
    $match: { 'form_fields.ValidationOptions.customMin': { $exists: true } },
  },
  { $count: 'numFormFields' },
])

// Count number of form FIELDS which are NOT (short text, long text and number fields) and
// with ValidationOptions.customMax
// Expect unchanged after update

db.forms.aggregate([
  { $unwind: '$form_fields' },
  {
    $match: {
      'form_fields.fieldType': { $nin: ['textfield', 'textarea', 'number'] },
    },
  },
  {
    $match: { 'form_fields.ValidationOptions.customMax': { $exists: true } },
  },
  { $count: 'numFormFields' },
])

// ********** UPDATE **********

// Remove customMin

db.forms.update(
  {
    form_fields: {
      $elemMatch: {
        $and: [
          {
            fieldType: { $in: ['textfield', 'textarea', 'number'] },
          },
          { 'ValidationOptions.customMin': { $exists: true } },
        ],
      },
    },
  },
  { $unset: { 'form_fields.$[elem].ValidationOptions.customMin': '' } },
  {
    arrayFilters: [
      {
        'elem.fieldType': { $in: ['textfield', 'textarea', 'number'] },
        'elem.ValidationOptions.customMin': { $exists: true },
      },
    ],
    multi: true,
  },
)

// Remove customMax

db.forms.update(
  {
    form_fields: {
      $elemMatch: {
        $and: [
          {
            fieldType: { $in: ['textfield', 'textarea', 'number'] },
          },
          { 'ValidationOptions.customMax': { $exists: true } },
        ],
      },
    },
  },
  { $unset: { 'form_fields.$[elem].ValidationOptions.customMax': '' } },
  {
    arrayFilters: [
      {
        'elem.fieldType': { $in: ['textfield', 'textarea', 'number'] },
        'elem.ValidationOptions.customMax': { $exists: true },
      },
    ],
    multi: true,
  },
)

// ********** AFTER **********

// Count number of forms with (short text, long text and number fields) and
// with ValidationOptions.customMin
// Expect 0 after running update

db.forms.count({
  form_fields: {
    $elemMatch: {
      $and: [
        {
          fieldType: { $in: ['textfield', 'textarea', 'number'] },
        },
        { 'ValidationOptions.customMin': { $exists: true } },
      ],
    },
  },
})

// Count number of forms with (short text, long text and number fields) and
// with ValidationOptions.customMax
// Expect 0 after running update

db.forms.count({
  form_fields: {
    $elemMatch: {
      $and: [
        {
          fieldType: { $in: ['textfield', 'textarea', 'number'] },
        },
        { 'ValidationOptions.customMax': { $exists: true } },
      ],
    },
  },
})

// Count number of form FIELDS with (short text, long text and number fields) and
// with ValidationOptions.customMin
// Expect 0 after running update

db.forms.aggregate([
  { $unwind: '$form_fields' },
  {
    $match: {
      'form_fields.fieldType': { $in: ['textfield', 'textarea', 'number'] },
    },
  },
  {
    $match: { 'form_fields.ValidationOptions.customMin': { $exists: true } },
  },
  { $count: 'numFormFields' },
])

// Count number of form FIELDS with (short text, long text and number fields) and
// with ValidationOptions.customMax
// Expect 0 after running update

db.forms.aggregate([
  { $unwind: '$form_fields' },
  {
    $match: {
      'form_fields.fieldType': { $in: ['textfield', 'textarea', 'number'] },
    },
  },
  {
    $match: { 'form_fields.ValidationOptions.customMax': { $exists: true } },
  },
  { $count: 'numFormFields' },
])


// Count number of form FIELDS which are NOT (short text, long text and number fields) and
// with ValidationOptions.customMin
// Expect unchanged after update

db.forms.aggregate([
  { $unwind: '$form_fields' },
  {
    $match: {
      'form_fields.fieldType': { $nin: ['textfield', 'textarea', 'number'] },
    },
  },
  {
    $match: { 'form_fields.ValidationOptions.customMin': { $exists: true } },
  },
  { $count: 'numFormFields' },
])

// Count number of form FIELDS which are NOT (short text, long text and number fields) and
// with ValidationOptions.customMax
// Expect unchanged after update

db.forms.aggregate([
  { $unwind: '$form_fields' },
  {
    $match: {
      'form_fields.fieldType': { $nin: ['textfield', 'textarea', 'number'] },
    },
  },
  {
    $match: { 'form_fields.ValidationOptions.customMax': { $exists: true } },
  },
  { $count: 'numFormFields' },
])
