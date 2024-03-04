import { Router } from 'express'

import {
  handleGenerateFormFields,
  handleGenerateQuestions,
} from '../../../../../modules/form/admin-form/admin-form.assistance.controller'

export const AssistanceRouter = Router()

AssistanceRouter.post('/questions', handleGenerateQuestions)
AssistanceRouter.post('/form-fields', handleGenerateFormFields)
