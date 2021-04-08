import { Router } from 'express'

import { withUserAuthentication } from '../../../../../modules/auth/auth.middlewares'
import { handleDeleteLogic } from '../../../../../modules/form/admin-form/admin-form.controller'

import { AdminFormsFeedbackRouter } from './admin-forms.feedback.routes'
import { AdminFormsFormRouter } from './admin-forms.form.routes'
import { AdminFormsPreviewRouter } from './admin-forms.preview.routes'
import { AdminFormsSettingsRouter } from './admin-forms.settings.routes'
import { AdminFormsSubmissionsRouter } from './admin-forms.submissions.routes'

export const AdminFormsRouter = Router()

// All routes in this handler should be protected by authentication.
AdminFormsRouter.use(withUserAuthentication)

AdminFormsRouter.use(AdminFormsSettingsRouter)
AdminFormsRouter.use(AdminFormsFeedbackRouter)
AdminFormsRouter.use(AdminFormsFormRouter)
AdminFormsRouter.use(AdminFormsSubmissionsRouter)
AdminFormsRouter.use(AdminFormsPreviewRouter)

/**
 * Deletes a logic.
 * @route DELETE /admin/forms/:formId/logic/:logicId
 * @group admin
 * @produces application/json
 * @consumes application/json
 * @returns 200 with success message when successfully deleted
 * @returns 403 when user does not have permissions to delete logic
 * @returns 404 when form cannot be found
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsRouter.route(
  '/:formId([a-fA-F0-9]{24})/logic/:logicId([a-fA-F0-9]{24})',
).delete(handleDeleteLogic)
