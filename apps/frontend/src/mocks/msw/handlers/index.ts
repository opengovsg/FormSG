import { authHandlers } from './auth'
import { envHandlers } from './env'
import { userHandlers } from './user'
import { workspaceHandlers } from './workspace'

export const handlers = [
  ...authHandlers,
  ...envHandlers,
  ...userHandlers(),
  ...workspaceHandlers(),
]
