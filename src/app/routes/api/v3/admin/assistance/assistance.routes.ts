import { Router } from 'express'

import { generateQuestions } from '../../../../../modules/form/admin-form/admin-form.assistance.controller'

export const AssistanceRouter = Router()

AssistanceRouter.post('/questions', generateQuestions)
