// Load libraries
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const flatten = require('flat')

// Load environment variables
const config = {
  dbUri: process.env.DB_URI,
  mongoConnectionOptions: {
    useNewUrlParser: true, // avoid using deprecated URL string parser in MongoDB driver
    useCreateIndex: true, // avoid using deprecated collection.ensureIndex internally
    useFindAndModify: false, // upgrade to mongo driver's native findOneAndUpdate function instead of findAndModify
  },
}

// Verify that all env variables are defined
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

// Set listeners on mongoose connect/disconnect
mongoose.connection.on('connected', () =>
  console.info(`Connected to mongodb ${config.dbUri}`, '\n'),
)
mongoose.connection.on('disconnected', () =>
  console.info(`Disconnected from mongodb`),
)

// Declare schemas
const User = mongoose.model('User', new Schema())
const Agency = mongoose.model('Agency', new Schema())
const Form = mongoose.model('Form', new Schema())

;(async () => {
  await mongoose.connect(config.dbUri, config.mongoConnectionOptions)

  let findAndCountKeys = (allDocuments, keysToIgnore) => {
    let documentCount = 0
    let collectionKeys = {}
    allDocuments.forEach((doc) => {
      keysToIgnore.forEach((keyToIgnore) => {
        delete doc[keyToIgnore]
      })
      const flatDocument = flatten(doc)
      Object.keys(flatDocument).forEach((key) => {
        if (collectionKeys[key]) {
          collectionKeys[key].uniqueTypes.add(typeof key)
          collectionKeys[key].count += 1
        } else {
          collectionKeys[key] = {
            uniqueTypes: new Set([typeof key]),
            count: 1,
          }
        }
      })
      documentCount += 1
    })
    let collectionKeysSorted = []
    Object.keys(collectionKeys).forEach((key) => {
      collectionKeysSorted.push({
        key,
        count: collectionKeys[key].count,
        types: Array.from(collectionKeys[key].uniqueTypes),
      })
    })
    collectionKeysSorted = collectionKeysSorted.sort((a, b) => {
      return b.count - a.count
    })
    return { collectionKeysSorted, documentCount }
  }

  // Find all users
  const allUsers = await User.find({}).lean().exec()
  const userResult = findAndCountKeys(allUsers, [])
  console.info('User count is:', userResult.documentCount)
  console.info(
    'Unique keys in User collection are:',
    userResult.collectionKeysSorted,
  )

  // Find all agencies
  const allAgencies = await Agency.find({}).lean().exec()
  const agencyResult = findAndCountKeys(allAgencies, [])
  console.info('Agency count is:', agencyResult.documentCount)
  console.info(
    'Unique keys in Agency collection are:',
    agencyResult.collectionKeysSorted,
  )

  // Find all forms
  const allForms = await Form.find({}).lean().exec()
  const formResult = findAndCountKeys(allForms, [
    'form_fields',
    'form_logics',
    'permissionList',
    'collaborators',
    'emails',
  ])
  console.info('Form count is:', formResult.documentCount)
  console.info(
    'Unique keys in Form collection are:',
    formResult.collectionKeysSorted,
  )

  await mongoose.connection.close()
})()
