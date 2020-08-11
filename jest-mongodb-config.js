// This file is used to instantiate `@shelf/jest-db`'s setup.
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
