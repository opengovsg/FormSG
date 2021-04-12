import config from './app/config/config'
import { createLoggerWithLabel } from './app/config/logger'
import loadApp from './app/loaders'

const logger = createLoggerWithLabel(module)

const initServer = async () => {
  const app = await loadApp()

  // Configure aws-sdk based on environment
  // sdk is later used to upload images to S3
  await config.configureAws()

  app.listen(config.port)

  logger.info({
    message: `[${config.nodeEnv}] Connected to port ${config.port}`,
    meta: {
      action: 'initServer',
    },
  })
}

void initServer()
