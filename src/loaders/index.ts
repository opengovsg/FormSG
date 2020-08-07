import { createLoggerWithLabel } from '../config/logger'

import expressLoader from './express'
import mongooseLoader from './mongoose'

const logger = createLoggerWithLabel('server')

export default async () => {
  const connection = await mongooseLoader()
  logger.info('MongoDB Intialized')

  const app = expressLoader(connection)
  logger.info('Express Intialized')

  return app
}
