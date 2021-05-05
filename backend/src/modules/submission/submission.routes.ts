import { Router } from 'express'

import { EmailSubmissionRouter } from './email-submission/email-submission.routes'
import { EncryptSubmissionRouter } from './encrypt-submission/encrypt-submission.routes'

export const SubmissionRouter = Router()

SubmissionRouter.use('/email', EmailSubmissionRouter)
SubmissionRouter.use('/encrypt', EncryptSubmissionRouter)
