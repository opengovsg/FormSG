/* eslint-disable */
// Scripts for #408

// Part 1: Verify that the database is internally consistent today for all short text, long text and number fields:

// a. customVal === customMin when selectedValidation === 'Minimum'
// Expect 0 records

db.getCollection('forms').aggregate([
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
