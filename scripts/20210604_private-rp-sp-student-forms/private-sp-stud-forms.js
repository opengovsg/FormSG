/* eslint-disable */

// BEFORE
// A: Count number of forms belonging to SP students that are still public.
{
  let spStudentUserIds = db.users.find({ email: /.+ichat\.sp\.edu\.sg$/i }).map(b => b._id)
  db.forms.find({ admin: { $in: spStudentUserIds }, status: 'PUBLIC' }).count()
}
// B: Count number of forms belonging to SP students that are private.
{
  let spStudentUserIds = db.users.find({ email: /.+ichat\.sp\.edu\.sg$/i }).map(b => b._id)
  db.forms.find({ admin: { $in: spStudentUserIds }, status: 'PRIVATE' }).count()
}

// UPDATE
// Number updated should be A
{
  let spStudentUserIds = db.users.find({ email: /.+ichat\.sp\.edu\.sg$/i }).map(b => b._id)
  let spStudentFormIds = db.forms.find({ admin: { $in: spStudentUserIds }, status: 'PUBLIC' }).map(b => b._id)

  db.forms.updateMany(
    {
      _id: { $in: spStudentFormIds },
    },
    {
      $set: {
        status: 'PRIVATE',
      },
    }
  )
}

// AFTER
// Count number of forms belonging to SP students that are still public
// Should be 0
{
  let spStudentUserIds = db.users.find({ email: /.+ichat\.sp\.edu\.sg$/i }).map(b => b._id)
  db.forms.find({ admin: { $in: spStudentUserIds }, status: 'PUBLIC' }).count()
}
// Count number of forms belonging to SP students that are private.
// Should be A + B
{
  let spStudentUserIds = db.users.find({ email: /.+ichat\.sp\.edu\.sg$/i }).map(b => b._id)
  db.forms.find({ admin: { $in: spStudentUserIds }, status: 'PRIVATE' }).count()
}
