const MongoClient = require('mongodb').MongoClient,
  ObjectId = require('mongodb').ObjectId,
  _ = require('lodash')

async function getStats(db) {
  console.log('Getting forms and checking languages')
  const collection = db.collection('forms')

  const cursor = await collection
    .find({
      responseMode: "encrypt",
      status: "PUBLIC",
      "form_logics.1": {$exists: true}
    })
    .project({
      form_fields: 1,
      form_logics: 1,
      status: 1,
      title: 1,
      admin: 1,
      created: 1,
    })

  await cursor.forEach((item) => {
    const id = item._id.toString()

    const dropDownFieldsWithInvalidSpaces = item.form_fields
      .filter(ff => ff.fieldType === 'dropdown')
      .filter(ff => ff.fieldOptions.some(fo => fo.trim() != fo))

    if (dropDownFieldsWithInvalidSpaces.length <= 0) return;

    console.log(id)
    console.error({
      formid: id,
      formFields: dropDownFieldsWithInvalidSpaces.map(ff => (
        {
          title: ff.title,
          options: ff.fieldOptions.map(o => `"${o}"`).join(','),
          badoptions: ff.fieldOptions.filter(fo => fo.trim() != fo).map(o => `"${o}"`).join(',')
        }))
    })
  })
}

;(async function main() {
  const client = new MongoClient(process.env.DB_URI)

  await client.connect()

  const db = client.db(process.env.DB_NAME)

  await getStats(db)

  client.close()
})()
