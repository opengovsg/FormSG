/* LOAD LIBRARIES */

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const flatten = require('flat')
const _ = require('lodash')
const fs = require('fs')
const LOG_FOLDER = './failures'
const REVIEW_FOLDER = './toReview'

/* LOAD ENVIROMENT VARIABLES */

const config = {
  dbUri: process.env.DB_URI,
  mongoConnectionOptions: {
    useNewUrlParser: true, // avoid using deprecated URL string parser in MongoDB driver
    useCreateIndex: true, // avoid using deprecated collection.ensureIndex internally
    useFindAndModify: false, // upgrade to mongo driver's native findOneAndUpdate function instead of findAndModify
  },
}

/* ENSURE VARIABLES ARE DEFINED */

const flatConfig = flatten(config)
for (const key of Object.keys(flatConfig)) {
  if (
    flatConfig[key] === null ||
    flatConfig[key] === undefined ||
    flatConfig[key] === ''
  ) {
    throw new Error(`Environment variable: ${key} not defined!!!`)
  }
}

/* SET LISTENERS ON MONGOOSE CONNECT/DISCONNECT */

mongoose.connection.on('connected', () =>
  console.info(`Connected to mongodb ${config.dbUri}`, '\n'),
)
mongoose.connection.on('disconnected', () =>
  console.info(`Disconnected from mongodb`),
)

/* DECLARE SCHEMAS */

const AnySchema = new Schema({ _id: Schema.Types.ObjectId }, { strict: false })
const Form = mongoose.model('Form', AnySchema)
const Agency = mongoose.model('Agency', AnySchema)
const User = mongoose.model('User', AnySchema)

/* DEFINE HELPER FUNCTIONS */

/**
 * Verifies that documents after script has run is as expected (without deleted keys)
 * @param {Array} documentsBeforeScript
 * @param {Array} documentsAfterScript
 * @param {Object} keysToDelete
 */
const compareDocuments = (
  documentsBeforeScript,
  documentsAfterScript,
  keysToDelete,
) => {
  if (documentsBeforeScript.length !== documentsAfterScript.length) {
    console.error(
      `Unexpected length ${documentsBeforeScript.length} !== ${documentsAfterScript.length}`,
    )
    return false
  }
  let failures = 0
  for (let i in documentsBeforeScript) {
    if (i % 10000 === 0) {
      console.info(
        `${((i / documentsBeforeScript.length) * 100).toFixed(2)} % complete`,
      )
    }
    const doc = _.cloneDeep(documentsBeforeScript[i])
    let keysDeleted = {}
    Object.keys(keysToDelete).forEach((keyToDelete) => {
      const deleted = _.get(doc, keyToDelete)
      if (deleted !== undefined) {
        keysDeleted[keyToDelete] = deleted
        _.unset(doc, keyToDelete)
      }
    })
    if (!_.isEqual(doc, documentsAfterScript[i])) {
      failures += 1
      fs.writeFileSync(
        `${LOG_FOLDER}/${doc._id}.json`,
        JSON.stringify(
          { keysDeleted, documentAfterScript: documentsAfterScript[i] },
          null,
          3,
        ),
        'utf8',
      )
    }
  }
  console.info(
    `totalDocuments=${documentsBeforeScript.length} numFailures=${failures}`,
  )
  return failures === 0
}

/**
 * Generates random integer between 0 and max
 * @param {Integer} max
 */
const getRandomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max))
}

/**
 * Deep diff between two object, using lodash
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
function difference(object, base) {
  function changes(object, base) {
    return _.transform(object, function (result, value, key) {
      if (!_.isEqual(value, base[key])) {
        result[key] =
          _.isObject(value) && _.isObject(base[key])
            ? changes(value, base[key])
            : value
      }
    })
  }
  return changes(object, base)
}
/**
 * Prints out randomly selected documents from before and after script is run
 * @param {Array} documentsBeforeScript
 * @param {Array} documentsAfterScript
 * @param {Integer} count - Number of documents to sample
 */
const randomlySelectDocuments = (
  documentsBeforeScript,
  documentsAfterScript,
  count,
  collectionName,
) => {
  const length = documentsBeforeScript.length
  for (let i = 1; i <= count; i++) {
    const index = getRandomInt(length)
    const diff = difference(
      documentsBeforeScript[index],
      documentsAfterScript[index],
    )
    fs.writeFileSync(
      `${REVIEW_FOLDER}/${collectionName}_${i}_${documentsBeforeScript[index]._id}.json`,
      JSON.stringify(
        {
          diff,
          documentBeforeScript: documentsBeforeScript[index],
          documentAfterScript: documentsAfterScript[index],
        },
        null,
        3,
      ),
    )
  }
}

/**
 * Runs delete script and compare document before and after script
 * @param {Object} Collection
 * @param {Object} keysToDelete
 */
const runScriptsOn = async (Collection, keysToDelete, collectionName) => {
  // Get state of database before script is run
  console.info(`1/5. Getting all ${collectionName} documents before script ...`)
  const allBeforeScript = await Collection.find({})
    .sort({ _id: 1 })
    .lean()
    .exec()

  // Run script to remove dangling keys
  console.info(`2/5. Running script ...`)
  await Collection.updateMany(
    {},
    {
      $unset: keysToDelete,
    },
  ).exec()

  // Get state of database after script is run
  console.info(`3/5. Getting all ${collectionName} documents after script ...`)
  const allAfterScript = await Collection.find({})
    .sort({ _id: 1 })
    .lean()
    .exec()

  // Randomly sample documents
  console.info('4/5. Randomly selecting documents for review ...')
  randomlySelectDocuments(allBeforeScript, allAfterScript, 15, collectionName)

  // Compare documents before and after script
  console.info('5/5. Comparing before and after documents ...')
  const isCleanUpSuccessful = compareDocuments(
    allBeforeScript,
    allAfterScript,
    keysToDelete,
  )
  console.info(
    `${collectionName} cleanup has`,
    isCleanUpSuccessful ? 'SUCCEEDED' : 'FAILED',
    '\n',
  )
}

;(async () => {
  await mongoose.connect(config.dbUri, config.mongoConnectionOptions)

  // Create folder for storing failed json
  fs.mkdirSync(LOG_FOLDER)

  // Create folder for storing changes in selected documents
  fs.mkdirSync(REVIEW_FOLDER)

  /* CLEAN UP USER COLLECTION */

  // Define keys to be deleted
  const userKeysToDelete = {
    hasLoggedInPasswordless: 1,
    salt: 1,
    roles: 1,
    lastModified: 1,
    username: 1,
    firstName: 1,
    provider: 1,
    passwordHash: 1,
    lastName: 1,
    language: 1,
    resetPasswordExpires: 1,
    resetPasswordToken: 1,
    isSuperAdmin: 1,
  }

  // Run script
  await runScriptsOn(User, userKeysToDelete, 'User')

  /* CLEAN UP AGENCY COLLECTION */

  // Define keys to be deleted
  const agencyKeysToDelete = {
    CorpPass: 1,
  }

  // Run script
  await runScriptsOn(Agency, agencyKeysToDelete, 'Agency')

  /* CLEAN UP FORM COLLECTION */

  // Define keys to be deleted
  const formKeysToDelete = {
    'startPage.formLogo': 1,
    collaborators: 1,
    design: 1,
    hasHeader: 1,
    hideFooter: 1,
    'endPage.showEnd': 1,
    'startPage.buttons': 1,
    'startPage.showStart': 1,
    'startPage.title': 1,
    'startPage.buttonText': 1,
    'endPage.hasCustomBackLink': 1,
    language: 1,
    'startPage.introButtonText': 1,
    'startPage.introTitle': 1,
    'startPage.introParagraph': 1,
    'startPage.type': 1,
    'endPage.type': 1,
  }

  // Run script
  await runScriptsOn(Form, formKeysToDelete, 'Form')

  await mongoose.connection.close()
})()
