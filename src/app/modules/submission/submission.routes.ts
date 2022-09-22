import { Router } from 'express'

import { EmailSubmissionRouter } from './email-submission/email-submission.routes'
import { EncryptSubmissionRouter } from './encrypt-submission/encrypt-submission.routes'

/** @deprecated use PublicFormsSubmissionsRouter in src/app/routes/api/v3/forms/public-forms.submissions.routes.ts instead. */
export const SubmissionRouter = Router()

SubmissionRouter.use('/email', EmailSubmissionRouter)
SubmissionRouter.use('/encrypt', EncryptSubmissionRouter)
