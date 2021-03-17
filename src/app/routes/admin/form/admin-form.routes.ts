import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import { SettingsUpdateDto } from '../../../../shared/typings/form'
import { AuthType, Status } from '../../../../types'
import { withUserAuthentication } from '../../../modules/auth/auth.middlewares'
import { handleUpdateSettings } from '../../../modules/form/admin-form/admin-form.controller'

export const ADMIN_FORM_NESTED_ROUTE = '/form'
export const AdminFormRouter = Router()

// All routes in this handler should be protected by authentication.
AdminFormRouter.use(withUserAuthentication)

/**
 * Joi validator for PATCH /form/:formId/settings route.
 */
const updateSettingsValidator = celebrate({
  [Segments.BODY]: Joi.object<SettingsUpdateDto>({
    authType: Joi.string().valid(...Object.values(AuthType)),
    emails: Joi.alternatives().try(
      Joi.array().items(Joi.string().email()),
      Joi.string().email({ multiple: true }),
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
  }).min(1),
})

AdminFormRouter.route('/:formId([a-fA-F0-9]{24})/settings').patch(
  updateSettingsValidator,
  handleUpdateSettings,
)
