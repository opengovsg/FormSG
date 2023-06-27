import { Router } from 'express'

import * as IssueController from '../../../../modules/issue/issue.controller'

export const PublicFormsIssueRouter = Router()

PublicFormsIssueRouter.route('/:formId([a-fA-F0-9]{24})/issue').post(
  IssueController.handleSubmitFormIssue,
)
