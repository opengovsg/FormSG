/* eslint-disable */

// BEFORE

// A: Number of SingPass forms
{
  db.forms.count({ authType: 'SP' })
}

// B: Number of forms with MyInfo fields AND SingPass
{
  db.forms.count({ authType: 'SP', 'form_fields.myInfo.attr': { $exists: true } })
}

// C: Total number of forms with MyInfo fields. May not be the same as above due to
// some forms in invalid state.
{
  db.forms.count({ 'form_fields.myInfo.attr': { $exists: true } })
}

// UPDATE
{
  db.forms.updateMany(
    { 'form_fields.myInfo.attr': { $exists: true } },
    { $set: { authType: 'MyInfo' } }
  )
}

// AFTER

// Number of forms with MyInfo fields AND MyInfo authType. Should be equal to C.
{
  db.forms.count({ 'form_fields.myInfo.attr': { $exists: true }, authType: 'MyInfo' })
}

// Number of MyInfo forms. Should be equal to C.
{
  db.forms.count({ authType: 'MyInfo' })
}

// Number of SingPass forms. Should be equal to A - B.
{
  db.forms.count({ authType: 'SP' })
}