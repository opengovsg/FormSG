import { MongoMemoryServer } from 'mongodb-memory-server-core'
import mongoose, { Connection } from 'mongoose'

import config from '../config/config'
import { createLoggerWithLabel } from '../config/logger'

const logger = createLoggerWithLabel('mongoose')

export default async (): Promise<Connection> => {
  let usingMockedDb = config.db.uri === undefined
  // Mock out the database if we're developing locally
  if (usingMockedDb) {
    logger.warn(
      '\n!!! WARNING !!!',
      '\nNo database configuration detected',
      '\nUsing mock development database instead.',
      '\nThis should NEVER be seen in production.',
    )

    if (!process.env.MONGO_BINARY_VERSION) {
      logger.error('Environment var MONGO_BINARY_VERSION is missing')
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
    config.db.uri = await mongod.getConnectionString()
  }

  // Actually connect to the database
  function connect() {
    return mongoose.connect(config.db.uri, config.db.options)
  }

  // Only required for initial connection errors, reconnect on error.
  connect().catch((err) => {
    logger.error(err)
    return connect()
  })

  mongoose.connection.on('error', (err) => {
    // No need to reconnect here since mongo config has auto reconnect, we log.
    logger.error('@MongoDB: DB error:', err)
  })

  mongoose.connection.on('open', function () {
    logger.info('@MongoDB: DB connected')
  })
  mongoose.connection.on('close', function (str) {
    logger.info('@MongoDB: DB disconnected: ' + str)
  })

  // Seed the db with govtech agency if using the mocked db
  if (usingMockedDb) {
    let Agency = mongoose.model('Agency')
    let agency = new Agency({
      shortName: 'govtech',
      fullName: 'Government Technology Agency',
      emailDomain: 'data.gov.sg',
      logo: '/public/modules/core/img/govtech.jpg',
    })
    agency.save()
  }

  return mongoose.connection
}
