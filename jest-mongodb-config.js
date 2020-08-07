module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      version: process.env.MONGO_BINARY_VERSION || '3.6.12',
      skipMD5: true,
    },
    instance: {
      dbName: 'jest',
    },
    autoStart: false,
  },
}
