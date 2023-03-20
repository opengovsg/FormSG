const MongoClient = require('mongodb').MongoClient,
  ObjectId = require('mongodb').ObjectId

const fs = require('fs')

async function getStats(db) {
  console.log('Getting forms and checking languages')
  const collection = db.collection('forms')

  const cursor = await collection
    .find({
      responseMode: 'encrypt',
      status: 'PUBLIC',
      'form_logics.1': { $exists: true },
    })
    .project({
      form_fields: 1,
      form_logics: 1,
      status: 1,
      title: 1,
      admin: 1,
      created: 1,
      permissionList: 1,
    })

  const formsWithInvalidWhiteSpace = {}
  const formsWhereWhiteSpaceAffectsLogic = {}
  const formsWhereWhiteSpaceAffectsLogicWithSubmissions = {}

  await cursor.forEach((item) => {
    const id = item._id.toString()

    const fieldsWithInvalidWhiteSpaces = item.form_fields
      .filter((ff) =>
        ['dropdown', 'radiobutton', 'checkbox'].includes(ff.fieldType),
      )
      .filter((ff) => ff.fieldOptions.some((fo) => fo.trim() != fo))

    if (fieldsWithInvalidWhiteSpaces.length <= 0) return

    formsWithInvalidWhiteSpace[id] = item

    const fields = fieldsWithInvalidWhiteSpaces.reduce((acc, ff) => {
      acc[ff._id.toString()] = ff
      ff.trimmedFieldOptions = ff.fieldOptions.map((v) => v.trim())
      return acc
    }, {})

    // now check if any of the conditions reference one of the invalid field AND if the condition has a whitespace mismatch
    all_logic: for (const fl of item.form_logics) {
      for (const flc of fl.conditions) {
        const field = fields[flc.field.toString()]

        if (!field) continue // not a target we care about

        let values
        try {
          values = Array.isArray(flc.value)
            ? flc.value.map((v) => v.trim())
            : [`${flc.value}`.trim()] // trim to repro logic from Feb 23rd fix
        } catch (err) {
          console.error(flc)
          console.error(field)
          throw err
        }

        for (const value of values) {
          if (field.fieldOptions.includes(value)) continue // the logic value matches field values - all good!
          if (field.trimmedFieldOptions.includes(value)) {
            // this is the bug we are after - the logic value only matches a field value if trimmed - not good T_T
            formsWhereWhiteSpaceAffectsLogic[id] = {
              form: item,
              condition: flc,
              value,
            }
            break all_logic
          }
        }
      }
    }

    if (formsWhereWhiteSpaceAffectsLogic[id]) {
      console.log({
        formid: id,
        field_with_invalid_whitespaces: fieldsWithInvalidWhiteSpaces.map(
          (ff) => ({
            id: ff._id.toString(),
            title: ff.title,
            values: ff.fieldOptions,
            bad_values: ff.fieldOptions
              .filter((fo) => fo.trim() != fo)
              .map((o) => `"${o}"`)
              .join(','),
          }),
        ),
        logic: {
          condition: formsWhereWhiteSpaceAffectsLogic[id].condition,
          value: formsWhereWhiteSpaceAffectsLogic[id].value,
        },
      })
    }
  })

  console.log('')
  console.log('Number of forms with field with invalid whitespace')
  console.log(Object.keys(formsWithInvalidWhiteSpace).length)
  console.log('Number of forms where whitespace affects logic:')
  console.log(Object.keys(formsWhereWhiteSpaceAffectsLogic).length)

  // TODO query submission to chedk how many forms of those forms had submissions in the past 3 weeks.

  const submissionCollection = db.collection('submissions')

  for (const id of Object.keys(formsWhereWhiteSpaceAffectsLogic)) {
    const affectedSubmissions = await submissionCollection.find({
      form: new ObjectId(id),
      created: {
        $gte: new Date('2023-02-23T11:50:00.000+0800'),
        $lt: new Date('2023-03-17T20:00:00.000+0800'),
      },
    })

    const numSubmissions = await affectedSubmissions.count()

    if (numSubmissions > 0) {
      formsWhereWhiteSpaceAffectsLogicWithSubmissions[id] =
        formsWhereWhiteSpaceAffectsLogic[id]
      formsWhereWhiteSpaceAffectsLogicWithSubmissions[id].numSubmissions =
        numSubmissions
      formsWhereWhiteSpaceAffectsLogicWithSubmissions[id].affectedSubmissions =
        await affectedSubmissions
          .project({ _id: 1 })
          .map((s) => s._id.toString())
          .toArray()
    }
  }

  console.log(
    'Number of forms where whitespace affects logic with submissions in the past 3 weeks:',
  )
  console.log(
    Object.keys(formsWhereWhiteSpaceAffectsLogicWithSubmissions).length,
  )

  const sortedForms = Object.values(
    formsWhereWhiteSpaceAffectsLogicWithSubmissions,
  ).sort((f1, f2) => f2.numSubmissions - f1.numSubmissions)

  console.log('Total number of potentially affected submissions:')
  console.log(sortedForms.reduce((acc, f) => (acc += f.numSubmissions), 0))

  console.log('-----')

  const logOutput = sortedForms
    .map(
      (data) => `${data.form._id} (${data.numSubmissions}): ${data.form.title}`,
    )
    .join('\n')

  console.log(logOutput)

  // write output to csv

  let output = [`RecipientEmail, Content`]

  for (const data of sortedForms) {
    // Add admin emails
    const adminEmail = await db
      .collection('users')
      .find({ _id: data.form.admin })
      .project({ email: 1, _id: 1 })
      .map((item) => item.email)
      .toArray()

    output.push(
      `${adminEmail[0]}, Admin, FormID: ${data.form._id}, Number of Potentially Affected Submission: ${data.numSubmissions}, Form Title: ${data.form.title}`,
    )

    // Add collaboarator emails
    for (const collaborator of data.form.permissionList) {
      const collaboratorEmail = collaborator.email
      output.push(
        `${collaboratorEmail}, Collaborator, FormID: ${data.form._id}, Number of Potentially Affected Submission: ${data.numSubmissions}, Form Title: ${data.form.title}`,
      )
    }
  }

  const csvOutput = output.join('\n')

  fs.writeFileSync('output.csv', csvOutput)
}

;(async function main() {
  const client = new MongoClient(process.env.DB_URI)

  await client.connect()

  const db = client.db(process.env.DB_NAME)

  await getStats(db)

  client.close()
})()
