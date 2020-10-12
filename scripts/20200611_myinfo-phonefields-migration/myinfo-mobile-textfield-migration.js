/* eslint-disable */
// prettier-ignore

// This is the code to migrate all MyInfo "Mobile Number" fields in existing
// forms from the current `textfield` field type to the new `mobile` field type.

// Side effect checks

// Get count of all MyInfo mobile fields to check for side effects
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        'myInfo.attr': 'mobileno',
      },
    },
  })
  .count()

// Initial text field counts
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        fieldType: 'textfield',
      },
    },
  })
  .count()

// Initial mobile field counts
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        fieldType: 'mobile',
      },
    },
  })
  .count()

// Get count of all forms with MyInfo mobile "textfield" fields
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        fieldType: 'textfield',
        'myInfo.attr': 'mobileno',
      },
    },
  })
  .count()

// Get count of all forms with MyInfo mobile "mobile" fields
// SHOULD BE ZERO
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        fieldType: 'mobile',
        'myInfo.attr': 'mobileno',
      },
    },
  })
  .count()

// !!!! MAIN UPDATE SCRIPT !!!!
// Update all currently mobiley textfields with mobile fieldtype
// Update result should be equal to previously textfield count.
db.getCollection('forms').updateMany(
  {
    form_fields: {
      $elemMatch: {
        fieldType: 'textfield',
        'myInfo.attr': 'mobileno',
      },
    },
  },
  { $set: { 'form_fields.$[filter].fieldType': 'mobile' } },
  {
    arrayFilters: [
      {
        'filter.fieldType': 'textfield',
        'filter.myInfo.attr': 'mobileno',
      },
    ],
  }
)
// !!!! END OF MAIN UPDATE SCRIPT !!!!

// Get count of all forms with MyInfo mobile "textfield" fields
// SHOULD NOW BE ZERO
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        fieldType: 'textfield',
        'myInfo.attr': 'mobileno',
      },
    },
  })
  .count()

// Get count of all forms with MyInfo mobile "mobile" fields
// SHOULD BE EQUAL TO PREVIOUSLY TEXTFIELD COUNT
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        fieldType: 'mobile',
        'myInfo.attr': 'mobileno',
      },
    },
  })
  .count()

// Side effect checks

// Should remain the same as the start
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        'myInfo.attr': 'mobileno',
      },
    },
  })
  .count()

// Should now have INITIAL_MOBILE + MYINFO_MOBILE fields
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        fieldType: 'mobile',
      },
    },
  })
  .count()

// Should now have INITIAL_TEXTFIELD - MYINFO_MOBILE fields
db.getCollection('forms')
  .find({
    form_fields: {
      $elemMatch: {
        fieldType: 'textfield',
      },
    },
  })
  .count()
