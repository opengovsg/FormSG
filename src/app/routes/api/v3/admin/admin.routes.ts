import { Router } from 'express'

import * as ReactMigrationController from '../../../../modules/react-migration/react-migration.controller'

import { AdminFormsRouter } from './forms'
import { WorkspacesRouter } from './workspaces'

export const AdminRouter = Router()

AdminRouter.use('/forms', AdminFormsRouter)
AdminRouter.use('/workspaces', WorkspacesRouter)

// TODO #4279: Remove after React rollout is complete
// This endpoint doesn't reaaaallly need to be a verified admin to be used
AdminRouter.get(
  '/environment/:ui(react|angular)',
  ReactMigrationController.adminChooseEnvironment,
)
