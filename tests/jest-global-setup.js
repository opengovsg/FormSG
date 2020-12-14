module.exports = async () => {
  const MongoBinary = require('mongodb-memory-server-core').MongoBinary
  if (!process.env.MONGO_BINARY_VERSION) {
    console.error('Environment var MONGO_BINARY_VERSION is missing')
    process.exit(1)
  }

  // Trigger download of binary before tests run as `mongodb-memory-server-core`
  // does not automatically download any binary version.
  await MongoBinary.getPath({
    version: String(process.env.MONGO_BINARY_VERSION),
  })
}
