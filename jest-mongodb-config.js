module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      version: process.env.MONGO_BINARY_VERSION || '3.6.12',
      checkMD5: true,
    },
    instance: {},
    autoStart: false,
  },
}
