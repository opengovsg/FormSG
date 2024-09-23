import { Router } from 'express'

import { handleTextPrompt } from '../../../../../modules/form/admin-form/admin-form.assistance.controller'

export const AdminFormsAssistanceRouter = Router()

AdminFormsAssistanceRouter.post(
  '/:formId([a-fA-F0-9]{24})/assistance/text-prompt',
  handleTextPrompt,
)
