/* eslint-disable */

// BEFORE
// Should be 0
{
  db.forms.count({ 'startPage.logo.fileId': { $eq: '1622549643061-sp%20student%20logo.png' } })
}

// UPDATE
{
  let spForms = []
  db.forms.updateMany(
    {
      _id: { $in: spForms }
    },
    { $set: { 'startPage.logo': {
      "state" : "CUSTOM",
      "fileId" : "1622549643061-sp%20student%20logo.png",
      "fileName" : "SP Student Logo.png",
      "fileSizeInBytes" : 14189
    } } }
  )
}

// AFTER

// Number of forms SP's logo fileId. Should be equal to C.
{
  db.forms.count({ 'startPage.logo.fileId': { $eq: '1622549643061-sp%20student%20logo.png' } })
}
