import { Router } from 'express'

import { callOpenAI } from '../../../../../modules/reform/reform.controller'

export const ReformRouter = Router()

ReformRouter.post('/create', callOpenAI)

ReformRouter.get('/migrate')

// reuse POST /admin/form
// ReformRouter.route('/save')
