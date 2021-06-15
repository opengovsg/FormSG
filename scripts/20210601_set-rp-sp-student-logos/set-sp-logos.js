/* eslint-disable */

// BEFORE
// A: Count number of forms belonging to SP students.
{
  let rpStudentUserIds = db.users.find({ email: /.+ichat\.sp\.edu\.sg$/i }).map(b => b._id)
  db.forms.find({ admin: { $in: rpStudentUserIds } }).count()
}
// Should be 0
{
  db.forms.count({ 'startPage.logo.fileId': { $eq: '1622549643061-sp%20student%20logo.png' } })
}

// UPDATE
{
  let spStudentUserIds = db.users.find({ email: /.+ichat\.sp\.edu\.sg$/i }).map(b => b._id)
  let spStudentFormIds = db.forms.find({ admin: { $in: spStudentUserIds } }).map(b => b._id)

  db.forms.updateMany(
    {
      _id: { $in: spStudentFormIds }
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

// Number of forms SP's logo fileId. Should be equal to A.
{
  db.forms.count({ 'startPage.logo.fileId': { $eq: '1622549643061-sp%20student%20logo.png' } })
}
// Should still remain the same as A.
{
  let rpStudentUserIds = db.users.find({ email: /.+ichat\.sp\.edu\.sg$/i }).map(b => b._id)
  db.forms.find({ admin: { $in: spStudentUserIds } }).count()
}
