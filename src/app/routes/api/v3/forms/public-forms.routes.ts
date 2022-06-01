import { Router } from 'express'

import { PublicFormsAuthRouter } from './public-forms.auth.routes'
import { PublicFormsFeedbackRouter } from './public-forms.feedback.routes'
import { PublicFormsFormRouter } from './public-forms.form.routes'
import { PublicFormSubmissionsFeedbackRouter } from './public-forms.submissions.feedback.routes'
import { PublicFormsSubmissionsRouter } from './public-forms.submissions.routes'
import { PublicFormsVerificationRouter } from './public-forms.verification.routes'

export const PublicFormsRouter = Router()

PublicFormsRouter.use(PublicFormsSubmissionsRouter)
PublicFormsRouter.use(PublicFormsFeedbackRouter)
PublicFormsRouter.use(PublicFormsFormRouter)
PublicFormsRouter.use(PublicFormsAuthRouter)
PublicFormsRouter.use(PublicFormsVerificationRouter)
// TODO: Cleanup PublicFormsFeedbackRouter once it's fully migrated to PublicFormSubmissionsFeedbackRouter
PublicFormsRouter.use(PublicFormSubmissionsFeedbackRouter)
