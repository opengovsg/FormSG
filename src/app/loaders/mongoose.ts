import { MongoMemoryServer } from 'mongodb-memory-server-core'
import mongoose, { Connection } from 'mongoose'

import config from '../config/config'
import { createLoggerWithLabel } from '../config/logger'

const logger = createLoggerWithLabel(module)

export default async (): Promise<Connection> => {
  const usingMockedDb = !config.db.uri
  // Mock out the database if we're developing locally
  if (usingMockedDb) {
    logger.warn({
      message:
        '!!! WARNING !!!\nNo database configuration detected\nUsing mock development database instead.\nThis should NEVER be seen in production.',
      meta: {
        action: 'init',
      },
    })

    if (!process.env.MONGO_BINARY_VERSION) {
      logger.error({
        message: 'Environment var MONGO_BINARY_VERSION is missing',
        meta: {
          action: 'init',
        },
      })
      process.exit(1)
    }

    const mongod = new MongoMemoryServer({
      binary: { version: String(process.env.MONGO_BINARY_VERSION) },
      instance: {
        port: 3000,
        ip: '127.0.0.1',
        dbName: 'formsg',
      },
    })

    // Store the uri to connect to later on
    config.db.uri = await mongod.getUri()
  }

  // Actually connect to the database
  function connect() {
    return mongoose.connect(config.db.uri, config.db.options)
  }

  // Only required for initial connection errors, reconnect on error.
  connect().catch((err) => {
    logger.error({
      message: '@MongoDB: Error caught while connecting',
      meta: {
        action: 'init',
      },
      error: err,
    })
    return connect()
  })

  mongoose.connection.on('error', (err) => {
    // No need to reconnect here since mongo config has auto reconnect, we log.
    logger.error({
      message: '@MongoDB: DB connection error',
      meta: {
        action: 'init',
      },
      error: err,
    })
  })

  mongoose.connection.on('open', function () {
    logger.info({
      message: '@MongoDB: DB connected',
      meta: {
        action: 'init',
      },
    })
  })

  mongoose.connection.on('close', function (str) {
    logger.info({
      message: `@MongoDB: DB disconnected: ${str}`,
      meta: {
        action: 'init',
      },
    })
  })

  // Seed the db with govtech agency if using the mocked db
  if (usingMockedDb) {
    const Agency = mongoose.model('Agency')
    const agency = new Agency({
      shortName: 'govtech',
      fullName: 'Government Technology Agency',
      emailDomain: 'data.gov.sg',
      logo: '/public/modules/core/img/govtech.jpg',
    })
    await agency.save()
  }

  return mongoose.connection
}
