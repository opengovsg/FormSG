import { Router } from 'express'

import { limitRate } from '../../../../../../app/utils/limit-rate'
import {
  handleGenerateFormFields,
  handleGenerateQuestions,
} from '../../../../../modules/form/admin-form/admin-form.assistance.controller'

export const AssistanceRouter = Router()

AssistanceRouter.post(
  '/questions',
  limitRate({ windowMs: 60 * 1000 * 60, max: 20 }),
  handleGenerateQuestions,
)
AssistanceRouter.post(
  '/form-fields',
  limitRate({ windowMs: 60 * 1000 * 60, max: 20 }),
  handleGenerateFormFields,
)
