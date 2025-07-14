import { GrowthBook } from '@growthbook/growthbook'
import { RequestHandler } from 'express'

import { GROWTHBOOK_DEV_PROXY } from '../../../../shared/constants/links'
import { GROWTHBOOK_API_HOST_PATH } from '../../../../shared/constants/routes'
import config from '../../config/config'
import { growthbookConfig } from '../../config/features/growthbook.config'
import { createLoggerWithLabel } from '../../config/logger'

const logger = createLoggerWithLabel(module)

const growthbookMiddleware: RequestHandler = async (req, res, next) => {
  // `${config.isDev ? GROWTHBOOK_DEV_PROXY : config.app.appUrl}${GROWTHBOOK_API_HOST_PATH}`,
  // This resolves to gbbp.form.gov.sg on vapt env, but due to the CF zerotrust setup, we no longer have control of the
  // gbbp domain, thus rerouting to vapt serve growthbook
  const apiHostOverride = `https://vapt.form.gov.sg${GROWTHBOOK_API_HOST_PATH}`
  req.growthbook = new GrowthBook({
    apiHost: apiHostOverride,
    clientKey: growthbookConfig.growthbookClientKey,
    enableDevMode: config.isDev,
  })

  logger.info({
    message: 'GrowthBook initialized',
    meta: {
      action: 'growthbookMiddleware',
      apiHost: apiHostOverride,
      clientKey: growthbookConfig.growthbookClientKey,
      enableDevMode: config.isDev,
    },
  })
  res.on('close', () => {
    if (req.growthbook) {
      req.growthbook.destroy()
    }
  })

  await req.growthbook.init({ timeout: 1000 }).then(() => next())
}

export default growthbookMiddleware
