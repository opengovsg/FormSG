import { Router } from 'express'

import { rateLimitConfig } from '../../../../../config/config'
import { handleTextPrompt } from '../../../../../modules/form/admin-form/admin-form.assistance.controller'
import { limitRate } from '../../../../../utils/limit-rate'

export const AdminFormsAssistanceRouter = Router()

AdminFormsAssistanceRouter.post(
  '/:formId([a-fA-F0-9]{24})/assistance/text-prompt',
  limitRate({ max: rateLimitConfig.makeTextPrompt }),
  handleTextPrompt,
)
