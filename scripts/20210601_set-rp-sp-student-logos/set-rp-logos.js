/* eslint-disable */

// BEFORE
// Should be 0
{
  db.forms.count({
    'startPage.logo.fileId': { $eq: '1622549887610-rp%20student%20logo.png' },
  })
}

// UPDATE
{
  let rpForms = []
  db.forms.updateMany(
    {
      _id: { $in: rpForms },
    },
    {
      $set: {
        'startPage.logo': {
          state: 'CUSTOM',
          fileId: '1622549887610-rp%20student%20logo.png',
          fileName: 'RP Student Logo.png',
          fileSizeInBytes: 15242,
        },
      },
    }
  )
}

// AFTER

// Number of forms SP's logo fileId. Should be equal to C.
{
  db.forms.count({
    'startPage.logo.fileId': { $eq: '1622549887610-rp%20student%20logo.png' },
  })
}
