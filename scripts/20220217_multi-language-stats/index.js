const MongoClient = require('mongodb').MongoClient,
  ObjectId = require('mongodb').ObjectId,
  _ = require('lodash'),
  fs = require('fs')

const categories = ['un', 'cn', 'ta', 'ms', 'en']

const languageRegexes = {
  cn: /[\u2E80-\u2FD5\u3190-\u319f\u3400-\u4DBF\u4E00-\u9FCC\uF900-\uFAAD]/,
  ta: /[\u0B02-\u0BCD]/,
  ms: /\b(anda|ini|sila|bagi|di)\b/i,
  en: /\b(the|a|please|one|be|do|is)\b/i,
}

const stats = {}

categories.forEach((lang) => (stats[lang] = new Set()))

const testFields = [
  'startPage.paragraph',
  'form_fields[0].title',
  'form_fields[0].description',
]

const startDate = new Date(process.env.START_DATE)

const formsById = {}

async function getAgencies(db) {
  const cursor = await db.collection('agencies').find({}).project({
    shortName: 1,
    fullName: 1,
  })

  const agencies = {}

  await cursor.forEach((item) => {
    agencies[item._id.toString()] = _.pick(item, ['shortName', 'fullName'])
  })

  return agencies
}

async function getStats(db) {
  console.log('Getting agencies')
  const agencies = await getAgencies(db)

  const getAgencyFromAdminId = async (adminId) => {
    const user = await db
      .collection('users')
      .findOne({ _id: ObjectId(adminId) })

    return agencies[user.agency.toString()]
  }

  console.log('Getting forms and checking languages')
  const collection = db.collection('forms')

  const cursor = await collection
    .find({
      created: { $gte: startDate },
    })
    .project({
      'startPage.paragraph': 1,
      form_fields: 1,
      status: 1,
      title: 1,
      admin: 1,
      created: 1,
    })

  await cursor.forEach((item) => {
    const id = item._id.toString()

    formsById[id] = {
      langs: new Set(),
      title: item.title,
      status: item.status,
      admin: item.admin.toString(),
    }

    for (const [lang, regex] of Object.entries(languageRegexes)) {
      for (const path of testFields) {
        if (regex.test(_.get(item, path))) {
          stats[lang].add(id)
          formsById[id].langs.add(lang)
        }
      }
    }

    if (!formsById[id].langs.size) {
      stats.un.add(id)
    }
  })

  console.log('========================================')
  console.log(`Number of forms created since: ${process.env.START_DATE}:`)
  console.log(Object.keys(formsById).length)

  console.log('========================================')
  console.log('Number of forms per detected language:')
  console.log(categories.map((lang) => [lang, stats[lang].size]))

  console.log('========================================')
  console.log('Sample public form Id:')
  console.log(
    categories.map((lang) => [
      lang,
      [...stats[lang]]
        .filter((id) => formsById[id].status === 'PUBLIC')
        .slice(0, 10),
    ]),
  )

  const outputFormTSVReport = async (header, filename, filter) => {
    console.log('========================================')
    console.log(header)
    const formIds = Object.keys(formsById).filter(filter)

    for (const id of formIds) {
      const form = formsById[id]

      form.numSubmissions = await db
        .collection('submissions')
        .find({ form: ObjectId(id) })
        .count()
      form.agency = await getAgencyFromAdminId(form.admin)
    }

    const reportContent = formIds
      .map((id) =>
        [
          id,
          formsById[id].title,
          [...formsById[id].langs].sort().join('+'),
          `${formsById[id].agency.shortName} (${formsById[id].agency.fullName})`,
          formsById[id].status,
          formsById[id].numSubmissions,
        ].join('\t'),
      )
      .join('\n')

    // 1. print report to console
    console.log(reportContent)
    // 2. save report to file
    fs.writeFileSync(filename, reportContent)
  }

  await outputFormTSVReport(
    'Getting agency and number of submissions for forms with multi-languages',
    'forms_multi_languages.tsv',
    (id) => formsById[id].langs.size > 1,
  )

  await outputFormTSVReport(
    'Getting agency and number of submissions for non-english forms',
    'forms_non_english_single_language.tsv',
    (id) =>
      formsById[id].langs.size === 1 &&
      !formsById[id].langs.has('en') &&
      !formsById[id].langs.has('un'),
  )
}

;(async function main() {
  const client = new MongoClient(process.env.DB_URI)

  await client.connect()

  const db = client.db(process.env.DB_NAME)

  await getStats(db)

  client.close()
})()
