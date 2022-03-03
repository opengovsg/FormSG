import { authHandlers } from './auth'
import { envHandlers } from './env'
import { userHandlers } from './user'

export const handlers = [...authHandlers, ...envHandlers, ...userHandlers()]
