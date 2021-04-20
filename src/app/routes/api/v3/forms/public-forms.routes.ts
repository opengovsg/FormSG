import { Router } from 'express'

import { PublicFormsFeedbackRouter } from './public-forms.feedback.routes'
import { PublicFormsFormRouter } from './public-forms.form.routes'
import { PublicFormsSubmissionsRouter } from './public-forms.submissions.routes'

export const PublicFormsRouter = Router()

PublicFormsRouter.use(PublicFormsSubmissionsRouter)
PublicFormsRouter.use(PublicFormsFeedbackRouter)
PublicFormsRouter.use(PublicFormsFormRouter)
