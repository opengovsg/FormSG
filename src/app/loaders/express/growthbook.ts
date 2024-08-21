import { GrowthBook } from '@growthbook/growthbook'
import { RequestHandler } from 'express'

import { GROWTHBOOK_DEV_PROXY } from '../../../../shared/constants/links'
import { GROWTHBOOK_API_HOST_PATH } from '../../../../shared/constants/routes'
import config from '../../config/config'
import { growthbookConfig } from '../../config/features/growthbook.config'

const growthbookMiddleware: RequestHandler = async (req, res, next) => {
  req.growthbook = new GrowthBook({
    apiHost: `${config.isDev ? GROWTHBOOK_DEV_PROXY : config.app.appUrl}${GROWTHBOOK_API_HOST_PATH}`,
    clientKey: growthbookConfig.growthbookClientKey,
    enableDevMode: config.isDev,
  })

  res.on('close', () => {
    if (req.growthbook) {
      req.growthbook.destroy()
    }
  })

  await req.growthbook.init({ timeout: 1000 }).then(() => next())
}

export default growthbookMiddleware
