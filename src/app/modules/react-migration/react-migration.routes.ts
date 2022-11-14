// TODO #4279: Remove after React rollout is complete
import { Router } from 'express'

import * as ReactMigrationController from './react-migration.controller'

export const ReactMigrationRouter = Router()

ReactMigrationRouter.get(
  '/:formId([a-fA-F0-9]{24})',
  ReactMigrationController.servePublicForm,
)

ReactMigrationRouter.get('/#!/:formId([a-fA-F0-9]{24})', (req, res) => {
  res.redirect(`/${req.params.formId}`)
})

// Redirect to the landing page after setting the admin cookie
ReactMigrationRouter.get(
  '/environment/:ui(react|angular)',
  ReactMigrationController.redirectAdminEnvironment,
)

ReactMigrationRouter.get('*', ReactMigrationController.serveDefault)
