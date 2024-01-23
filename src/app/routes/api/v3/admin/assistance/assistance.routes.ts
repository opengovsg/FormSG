import { Router } from 'express'

import {
  generateFormFields,
  generateQuestions,
} from '../../../../../modules/form/admin-form/admin-form.assistance.controller'

export const AssistanceRouter = Router()

AssistanceRouter.post('/questions', generateQuestions)
AssistanceRouter.post('/form-fields', generateFormFields)
