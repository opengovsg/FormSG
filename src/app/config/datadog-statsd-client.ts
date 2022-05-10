import { StatsD } from 'hot-shots'

export const statsdClient = new StatsD({ useDefaultRoute: true })
