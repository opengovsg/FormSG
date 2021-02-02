import { Router } from 'express'

import { EmailSubmissionRouter } from './email-submission/email-submission.routes'

export const SubmissionRouter = Router()
SubmissionRouter.use('/email', EmailSubmissionRouter)
