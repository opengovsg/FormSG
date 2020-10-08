/* eslint-disable */
// prettier-ignore

// This is the code to migrate all MyInfo "Home Number" fields in existing
// forms from the current `textfield` field type to the new `homeno` field type.

// Side effect checks

// Get count of all homeno fields to check for side effects
// Should be 0
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        fieldType: 'homeno',
      },
    },
  })
  .count()

db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        fieldType: 'textfield',
      },
    },
  })
  .count()

db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        'myInfo.attr': 'homeno',
      },
    },
  })
  .count()

// Main checks

// Get count of all forms with MyInfo homeno "textfield" fields
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        fieldType: 'textfield',
        'myInfo.attr': 'homeno',
      },
    },
  })
  .count()

// Get count of all forms with MyInfo homeno "homeno" fields
// SHOULD BE ZERO
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        fieldType: 'homeno',
        'myInfo.attr': 'homeno',
      },
    },
  })
  .count()

// !!!! MAIN UPDATE SCRIPT !!!!
// Update all currently homeno textfields with homeno fieldtype
// Update result should be equal to previously textfield count.
db.getCollection('forms').updateMany(
  {
    form_fields: {
      $elemMatch: {
        fieldType: 'textfield',
        'myInfo.attr': 'homeno',
      },
    },
  },
  { $set: { 'form_fields.$[filter].fieldType': 'homeno' } },
  {
    arrayFilters: [
      {
        'filter.fieldType': 'textfield',
        'filter.myInfo.attr': 'homeno',
      },
    ],
  }
)
// !!!! END OF MAIN UPDATE SCRIPT !!!!

// Get count of all forms with MyInfo homeno "textfield" fields
// SHOULD NOW BE ZERO
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        fieldType: 'textfield',
        'myInfo.attr': 'homeno',
      },
    },
  })
  .count()

// Get count of all forms with MyInfo homeno "homeno" fields
// SHOULD BE EQUAL TO PREVIOUSLY TEXTFIELD COUNT
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        fieldType: 'homeno',
        'myInfo.attr': 'homeno',
      },
    },
  })
  .count()

// Side effect checks

// Get count of all homeno fields to check for side effects
// Should now be the same as initial MyInfo homeno text field count
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        fieldType: 'homeno',
      },
    },
  })
  .count()

// Should now have INITIAL_TEXTFIELD - NEW_HOMENO counts
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        fieldType: 'textfield',
      },
    },
  })
  .count()

// Should have no difference from the initial counts
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        'myInfo.attr': 'homeno',
      },
    },
  })
  .count()
