import { Router } from 'express'

import { AssistanceRouter } from './assistance/assistance.routes'
import { AdminFormsRouter } from './forms'
import { WorkspacesRouter } from './workspaces'

export const AdminRouter = Router()

AdminRouter.use('/forms', AdminFormsRouter)
AdminRouter.use('/workspaces', WorkspacesRouter)
AdminRouter.use('/assistance', AssistanceRouter)
