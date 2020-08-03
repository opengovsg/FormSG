import config from './config/config'
import { createLoggerWithLabel } from './config/logger'
import loadApp from './loaders'

const logger = createLoggerWithLabel('server')

const initServer = async () => {
  const app = await loadApp()

  // Configure aws-sdk based on environment
  // sdk is later used to upload images to S3
  await config.configureAws()

  app.listen(config.port)
  logger.info('--')
  logger.info('Environment: ' + config.nodeEnv)
  logger.info('Port:        ' + config.port)
  logger.info('--')
}

initServer()
