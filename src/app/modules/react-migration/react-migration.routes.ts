import { Router } from 'express'

import * as ReactMigrationController from './react-migration.controller'

export const ReactMigrationRouter = Router()

ReactMigrationRouter.get(
  '/:formId([a-fA-F0-9]{24})',
  ReactMigrationController.serveForm,
)

ReactMigrationRouter.get('/#!/:formId([a-fA-F0-9]{24})', (req, res) => {
  res.redirect(`/${req.params.formId}`)
})

ReactMigrationRouter.get('*', ReactMigrationController.serveDefault)
