import { setupWorker } from 'msw/browser'

import { handlers } from './handlers'
import { workspaceHandlers } from './handlers/workspace'

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...handlers)

export const workspaceWorker = setupWorker(...workspaceHandlers())
