import { Router } from 'express'

import { PublicFormsAuthRouter } from './public-forms.auth.routes'
import { PublicFormsFeedbackRouter } from './public-forms.feedback.routes'
import { PublicFormsFormRouter } from './public-forms.form.routes'
import { PublicFormsIssueRouter } from './public-forms.issue.routes'
import { PublicFormsRespondentCopyRouter } from './public-forms.respondentCopy.routes'
import { PublicFormsSubmissionsRouter } from './public-forms.submissions.routes'
import { PublicFormsVerificationRouter } from './public-forms.verification.routes'

export const PublicFormsRouter = Router()

PublicFormsRouter.use(PublicFormsSubmissionsRouter)
PublicFormsRouter.use(PublicFormsFeedbackRouter)
PublicFormsRouter.use(PublicFormsFormRouter)
PublicFormsRouter.use(PublicFormsAuthRouter)
PublicFormsRouter.use(PublicFormsVerificationRouter)
PublicFormsRouter.use(PublicFormsIssueRouter)
PublicFormsRouter.use(PublicFormsRespondentCopyRouter)
