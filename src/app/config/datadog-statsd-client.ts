import { StatsD } from 'hot-shots'

import config from './config'

export const statsdClient = new StatsD({
  useDefaultRoute: !config.isDevOrTest,
})
