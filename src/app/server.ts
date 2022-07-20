import './loaders/datadog-tracer'

import config from './config/config'
import { createLoggerWithLabel } from './config/logger'
import loadApp from './loaders'

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
