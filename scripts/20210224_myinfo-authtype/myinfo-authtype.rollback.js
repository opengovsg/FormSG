/* eslint-disable */

// BEFORE

// A: Number of MyInfo authType forms
{
  db.forms.count({ authType: 'MyInfo' })
}

// B: Number of SingPass authType forms
{
  db.forms.count({ authType: 'SP' })
}

// UPDATE
{
  db.forms.updateMany(
    { authType: 'MyInfo' },
    { $set: { authType: 'SP' } }
  )
}

// AFTER

// Number of forms with authType SP. Should be equal to A + B.
{
  db.forms.count({ authType: 'SP' })
}