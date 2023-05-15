import { Router } from 'express'

import * as PublicFormController from '../../../../modules/form/public-form/public-form.controller'
import { injectFeedbackFormUrl } from '../../../../modules/form/public-form/public-form.middlewares'
import * as ReactMigrationController from '../../../../modules/react-migration/react-migration.controller'

export const PublicFormsFormRouter = Router()

/**
 * Returns the specified form to the user, along with any
 * identify information obtained from Singpass/Corppass/MyInfo.
 *
 * WARNING: TemperatureSG batch jobs rely on this endpoint to
 * retrieve the master list of personnel for daily reporting.
 * Please strictly ensure backwards compatibility.
 * @route GET /:formId
 *
 * @returns 200 with form when form exists and is public
 * @returns 404 when form is private or form with given ID does not exist
 * @returns 410 when form is archived
 * @returns 500 when database error occurs
 */
PublicFormsFormRouter.route('/:formId([a-fA-F0-9]{24})').get(
  PublicFormController.handleGetPublicForm,
)

/**
 * Returns a sample submission response of the specified form to the user
 *
 * @route GET /:formId/sample-submission
 *
 * @returns 200 with form when form exists and is public
 * @returns 404 when form is private or form with given ID does not exist
 * @returns 410 when form is archived
 * @returns 500 when database error occurs
 */
PublicFormsFormRouter.route('/:formId([a-fA-F0-9]{24})/sample-submission').get(
  PublicFormController.handleGetPublicFormSampleSubmission,
)

// TODO #4279: Remove after React rollout is complete
/**
 * Returns the React to Angular switch feedback form to the user
 * @route GET /switchenvfeedback
 * @returns 200 with form when form exists and is public
 * @returns 404 when form is private or form with given ID does not exist
 * @returns 410 when form is archived
 * @returns 500 when database error occurs
 */
PublicFormsFormRouter.route(`/switchenvfeedback`).get(
  injectFeedbackFormUrl,
  PublicFormController.handleGetPublicForm,
)

/**
 * Switches the environment cookie for a public form
 * @route GET /environment/:ui
 */
PublicFormsFormRouter.route('/environment/:ui(react|angular)').get(
  ReactMigrationController.publicChooseEnvironment,
)
