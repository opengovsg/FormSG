/* eslint-disable */

// BEFORE
// A: Count number of forms belonging to RP students.
{
  let rpStudentUserIds = db.users.find({ email: /.+myrp\.edu\.sg$/i }).map(b => b._id)
  db.forms.find({ admin: { $in: rpStudentUserIds } }).count()
}
// Should be 0
{
  db.forms.count({
    'startPage.logo.fileId': { $eq: '1622549887610-rp%20student%20logo.png' },
  })
}

// UPDATE
{
  let rpStudentUserIds = db.users.find({ email: /.+myrp\.edu\.sg$/i }).map(b => b._id)
  let rpStudentFormIds = db.forms.find({ admin: { $in: rpStudentUserIds } }).map(b => b._id)

  db.forms.updateMany(
    {
      _id: { $in: rpStudentFormIds },
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

// Number of forms RP's logo fileId. Should be equal to A.
{
  db.forms.count({
    'startPage.logo.fileId': { $eq: '1622549887610-rp%20student%20logo.png' },
  })
}
// Count number of forms belonging to RP students.
// Should still remain the same as A.
{
  let rpStudentUserIds = db.users.find({ email: /.+myrp\.edu\.sg$/i }).map(b => b._id)
  db.forms.find({ admin: { $in: rpStudentUserIds } }).count()
}