/* eslint-disable */

// BEFORE
// A: Count number of forms belonging to RP students that are still public.
{
  let rpStudentUserIds = db.users.find({ email: /.+myrp\.edu\.sg$/i }).map(b => b._id)
  db.forms.find({ admin: { $in: rpStudentUserIds }, status: 'PUBLIC' }).count()
}
// B: Count number of forms belonging to RP students that are private.
{
  let rpStudentUserIds = db.users.find({ email: /.+myrp\.edu\.sg$/i }).map(b => b._id)
  db.forms.find({ admin: { $in: rpStudentUserIds }, status: 'PRIVATE' }).count()
}

// UPDATE
// Number updated should be A
{
  let rpStudentUserIds = db.users.find({ email: /.+myrp\.edu\.sg$/i }).map(b => b._id)
  let rpStudentFormIds = db.forms.find({ admin: { $in: rpStudentUserIds }, status: 'PUBLIC' }).map(b => b._id)

  db.forms.updateMany(
    {
      _id: { $in: rpStudentFormIds },
    },
    {
      $set: {
        status: 'PRIVATE',
      },
    }
  )
}

// AFTER
// Count number of forms belonging to RP students that are still public
// Should be 0
{
  let rpStudentUserIds = db.users.find({ email: /.+myrp\.edu\.sg$/i }).map(b => b._id)
  db.forms.find({ admin: { $in: rpStudentUserIds }, status: 'PUBLIC' }).count()
}
// Count number of forms belonging to RP students that are private.
// Should be A + B
{
  let rpStudentUserIds = db.users.find({ email: /.+myrp\.edu\.sg$/i }).map(b => b._id)
  db.forms.find({ admin: { $in: rpStudentUserIds }, status: 'PRIVATE' }).count()
}