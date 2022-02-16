## Scripts for MongoDB

These scripts are meant to be copied and paste into the MongoDB shell in an interface
such as Robo3T. Do remember to change the arguments of the functions.

- **Unlisting from examples tab**

**Do note that the scripts are only meant to be used in NoSQL Booster.**

```javascript
/**
 * Unlist a form from the examples page
 * @param  {String} id of the form
 */
function unlistFormFromExamples(id) {
  //Check if id provided is valid
  if (!ObjectId.isValid(id)) throw new Error('Id is not valid')
  const formId = ObjectId(id)
  const result = db.forms.update(
    { _id: formId },
    { $set: { isListed: false } }
  )
  if (result.nMatched === 0) throw new Error(`Form ${formId} not found`)

  return db.forms.find({ _id: formId })
}
// unlistFormFromExamples("form id")
```

```javascript
/**
 * Unlist an array of forms from the examples page
 * @param  {String[]} ids of the forms. These can be any string
 * where the first sequence of 24 consecutive alphanumerics is the
 * form ID, e.g. the form link.
 */
function unlistFormArrayFromExamples(ids) {
  const formIdRegex = /[0-9a-fA-F]{24}/
  // Wrap all ids in ObjectId
  const objectIds = []
  for (let id of ids) {
    const parsed = formIdRegex.exec(id)
    if (parsed) {
      objectIds.push(ObjectId(parsed[0]))
    } else {
      throw new Error(`${id} does not contain a valid form ID.`)
    }
  }
  const result = db
    .getCollection('forms')
    .updateMany({ _id: { $in: objectIds } }, { $set: { isListed: false } })
  return `${ids.length} forms given, ${result.matchedCount} matched, ${result.modifiedCount} modified`
}
// const ids = ['https://some.url/5f8817b7bde9d4002a800d78', 'some.url/#!/5f9a587b119c07002b56124f']
// unlistFormArrayFromExamples(ids)
```
- **Manually archive forms**

```javascript
/**
 * Set an array of forms to status ARCHIVED
 * @param  {String[]} ids of the forms. These can be any string
 * where the first sequence of 24 consecutive alphanumerics is the
 * form ID, e.g. the form link.
 */
function archiveFormArray(ids) {
  const formIdRegex = /[0-9a-fA-F]{24}/
  // Wrap all ids in ObjectId
  const objectIds = []
  for (let id of ids) {
    const parsed = formIdRegex.exec(id)
    if (parsed) {
      objectIds.push(ObjectId(parsed[0]))
    } else {
      throw new Error(`${id} does not contain a valid form ID.`)
    }
  }
  const result = db
    .getCollection('forms')
    .updateMany({ _id: { $in: objectIds } }, { $set: { status: 'ARCHIVED' } })
  return `${ids.length} forms given, ${result.matchedCount} matched, ${result.modifiedCount} modified`
}
// const ids = ['https://some.url/5ea8de1c73e4c00014059071', 'some.url/#!/5e868570a2c4d3001124dfff']
// archiveFormArray(ids)
```

- **Create new agency**

```javascript
/**
 * Unlist a form from the examples page
 * @param  {String} shortName of the agency
 * @param  {String} fullName of the agency
 * @param  {String} logoUrl url of the agency's logo
 * @param  {String[]} emailDomains array of domains that the agency uses
 */
function createAgency(shortName, fullName, logoUrl, emailDomains) {
  if (!(emailDomains instanceof Array))
    throw new Error(`Email domains not in an array, emailDomains: ${emailDomains}`)

  return db.agencies.insert([
    {
      shortName: shortName,
      fullName: fullName,
      logo: logoUrl,
      emailDomain: emailDomains
    }
  ])
}

// createAgency("shortName", "fullName", "logoUrl", ["email.test.sg"])
```

- **Migration of form admin**

```javascript
/**
 * Transfers all forms owned by a form admin to the new admin
 * @param  {String} oldAdminEmail email address of the current admin
 * @param  {String} newAdminEmail email address of the new admin
 */
function migrateAllForms(oldAdminEmail, newAdminEmail) {
  const oldAdmin = db.users.findOne({ email: oldAdminEmail })
  if (oldAdmin === null)
    throw new Error(`Could not find any user with the email address: ${oldAdminEmail}`)

  const newAdmin = db.users.findOne({ email: newAdminEmail })
  if (newAdmin === null)
    throw new Error(`Could not find any user with the email address: ${newAdminEmail}`)

  return db.forms.update(
    { admin: oldAdmin._id },
    { $set: { admin: newAdmin._id } },
    { multi: true }
  )
}
// migrateAllForms("oldAdmin", "newAdmin")
```

```javascript
/**
 * Change a form's admin
 * @param  {String} oldAdminEmail email address of the current admin
 * @param  {String} newAdminEmail email address of the new admin
 * @param  {String} formId  id of the form that needs to be transferred
 */
function migrateOneForm(id, oldAdminEmail, newAdminEmail) {
  //Check if id provided is valid
  if (!ObjectId.isValid(id)) throw new Error(`Could not find form, id : ${id}`)
  const formId = ObjectId(id)

  const oldAdmin = db.users.findOne({ email: oldAdminEmail })
  if (oldAdmin === null)
    throw new Error(`Could not find any user with the email address: ${oldAdminEmail}`)

  const newAdmin = db.users.findOne({ email: newAdminEmail })
  if (newAdmin === null)
    throw new Error(`Could not find any user with the email address: ${newAdminEmail}`)

  let form = db.forms.findOne({ _id: formId, admin: oldAdmin._id })
  if (form === null)
    throw new Error(`Could not find form ${id} that belongs to ${oldAdminEmail}`)

  db.forms.update(
    { _id: formId, admin: oldAdmin._id },
    { $set: { admin: newAdmin._id } }
  )

  return db.forms.find({ _id: formId })
}
// migrateOneForm("form id", "oldAdmin", "newAdmin")
```
