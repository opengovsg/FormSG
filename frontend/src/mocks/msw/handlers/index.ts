import { authHandlers } from './auth'
import { settingsHandlers } from './settings'

export const handlers = [...authHandlers, ...settingsHandlers]
