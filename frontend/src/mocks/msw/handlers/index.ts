import { authHandlers } from './auth'
import { envHandlers } from './env'

export const handlers = [...authHandlers, ...envHandlers]
