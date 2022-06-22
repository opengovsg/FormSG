const MongoBinary = require('mongodb-memory-server-core').MongoBinary
if (!process.env.MONGO_BINARY_VERSION) {
  console.error('Environment var MONGO_BINARY_VERSION is missing')
  process.exit(1)
}

// mongodb-memory-server-core does not automatically download any binary version
// Therefore, trigger download of binary before tests run
MongoBinary.getPath({ version: String(process.env.MONGO_BINARY_VERSION) })
  .then((binPath) => {
    console.info(`mongodb-memory-server: binary path is ${binPath}`)
  })
  .catch((err) => {
    console.error(`failed to download/install MongoDB binaries. The error:
${err}`)
    process.exit(1)
  })
