import { Router } from 'express'

export const AdminFormsReformRouter = Router()

AdminFormsReformRouter.route('/create')

AdminFormsReformRouter.route('/migrate')

// reuse POST /admin/form
// AdminFormsReformRouter.route('/save')
