import { StatsD } from 'hot-shots'

import config from './config'

export const statsdClient = new StatsD({
  useDefaultRoute: true,
  mock: config.isDev,
})
