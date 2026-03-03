import { Router } from 'express'

import { rateLimitConfig } from '../../../../config/config'
import * as IssueController from '../../../../modules/issue/issue.controller'
import { limitRate } from '../../../../utils/limit-rate'

export const PublicFormsIssueRouter = Router()

/**
 * Creates a form issue.
 * @route /:formId/issue
 * @group forms - endpoints to serve forms
 * @param {string} formId.path.required - the form id
 * @param {Issue.model} issue.body.required - the user's issue complaint
 * @consumes application/json
 * @produces application/json
 * @returns 200 if issue was successfully saved
 * @returns 400 if form issue was malformed and hence cannot be saved
 * @returns 404 if form with formId does not exist, or form is private
 * @returns 410 if form has been archived
 * @returns 500 if database error occurs
 */
PublicFormsIssueRouter.route('/:formId([a-fA-F0-9]{24})/issue').post(
  limitRate({ max: rateLimitConfig.publicFormIssueFeedback }),
  IssueController.handleSubmitFormIssue,
)
