import { Router } from 'express'

import {
  generateFormFields,
  generateQnsList,
} from '../../../../../modules/reform/reform.controller'

export const ReformRouter = Router()

ReformRouter.post('/create/questions-list', generateQnsList)
ReformRouter.post('/create/form', generateFormFields)

ReformRouter.get('/migrate')
