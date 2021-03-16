import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import { AuthType, Status } from '../../../../types'
import { withUserAuthentication } from '../../auth/auth.middlewares'

import { handleUpdateSettings } from './admin-form.controller'
import { SettingsUpdateBody } from './admin-form.types'

export const AdminRouter = Router()

// All routes in this handler should be protected by authentication.
AdminRouter.use(withUserAuthentication)

/**
 * Joi validator for PATCH /form/:formId/settings route.
 */
const updateSettingsValidator = celebrate({
  [Segments.BODY]: Joi.object<SettingsUpdateBody>({
    authType: Joi.string().valid(...Object.values(AuthType)),
    emails: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string(),
    ),
    esrvcId: Joi.string().allow(''),
    hasCaptcha: Joi.boolean(),
    inactiveMessage: Joi.string(),
    status: Joi.string().valid(...Object.values(Status)),
    submissionLimit: Joi.number().allow(null),
    title: Joi.string(),
    webhook: Joi.object({
      url: Joi.string().uri().required().allow(''),
    }),
  }),
})

AdminRouter.route('/form/:formId([a-fA-F0-9]{24})/settings').patch(
  updateSettingsValidator,
  handleUpdateSettings,
)
