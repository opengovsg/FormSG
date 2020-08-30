import { createLoggerWithLabel } from '../config/logger'

import expressLoader from './express'
import mongooseLoader from './mongoose'

const logger = createLoggerWithLabel(module)

export default async () => {
  const connection = await mongooseLoader()
  logger.info({
    message: 'MongoDB Initialized',
    meta: {
      action: 'init',
    },
  })

  const app = expressLoader(connection)
  logger.info({
    message: 'Express Initialized',
    meta: {
      action: 'init',
    },
  })

  return app
}
