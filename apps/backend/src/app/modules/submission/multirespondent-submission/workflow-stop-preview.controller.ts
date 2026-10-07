/**
 * DESIGN PREVIEW ONLY. Sends workflow-stop emails so the flow can be demoed
 * end to end. Nothing is stopped or assigned server-side: that state lives in
 * the frontend's design-preview store. The routes are only registered in local
 * development (see admin-forms.submissions.routes.ts).
 *
 * TODO(workflow-stop): delete this file and its routes once the real endpoints
 * exist. They should persist the stop or new assignees on the submission,
 * resolve recipients and the response summary server-side, and send these
 * emails themselves.
 */
import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import { getMultirespondentSubmissionEditPath } from 'formsg-shared/utils/urls'
import moment from 'moment-timezone'
import { ResultAsync } from 'neverthrow'

import { IPopulatedMultirespondentForm } from '../../../../types'
import config from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import MailService from '../../../services/mail/mail.service'
import { createReqMeta } from '../../../utils/request'
import { QuestionAnswer } from '../../../views/templates/EmailTemplate'
import * as AuthService from '../../auth/auth.service'
import { ControllerHandler } from '../../core/core.types'
import { PermissionLevel } from '../../form/admin-form/admin-form.types'
import * as UserService from '../../user/user.service'
import { mapRouteError, sendRouteError } from '../submission.utils'

import { checkFormIsMultirespondent } from './multirespondent-submission.service'

const logger = createLoggerWithLabel(module)

const emailsSchema = Joi.array()
  .items(Joi.string().trim().lowercase().email())
  .unique()
  .min(1)
  .max(30)
  .required()

const questionAnswersSchema = Joi.array()
  .items(
    Joi.object({
      question: Joi.string().allow('').required(),
      answer: Joi.string().allow('').required(),
      fieldType: Joi.string(),
    }),
  )
  .required()

type Params = { formId: string; submissionId: string }

/**
 * Shared handler: checks the admin can edit the form and that it is a workflow
 * form, then sends the email and logs the outcome.
 */
const createPreviewEmailHandler =
  <Body extends { emails: string[] }>(
    action: string,
    send: (args: {
      form: IPopulatedMultirespondentForm
      formId: string
      submissionId: string
      body: Body
    }) => ResultAsync<unknown, Parameters<typeof mapRouteError>[0]>,
  ): ControllerHandler<Params, unknown, Body> =>
  async (req, res) => {
    const { formId, submissionId } = req.params
    const logMeta = { action, formId, submissionId, ...createReqMeta(req) }

    return UserService.findUserById((req.session as AuthedSessionData).user._id)
      .andThen((user) =>
        AuthService.getFormAfterPermissionChecks({
          user,
          formId,
          // Every collaborator level can act on a workflow: if you can view the
          // results, you can act on them.
          level: PermissionLevel.Read,
        }),
      )
      .andThen(checkFormIsMultirespondent)
      .andThen((form) => send({ form, formId, submissionId, body: req.body }))
      .map(() => {
        logger.info({ message: `${action} sent`, meta: logMeta })
        return res.json({ message: 'Email sent.' })
      })
      .mapErr((error) => {
        logger.error({ message: `${action} failed`, meta: logMeta, error })
        return sendRouteError(res, mapRouteError(error))
      })
  }

/**
 * POST /:formId/submissions/:submissionId/stop-preview-email
 * Sends the "workflow stopped" outcome email.
 */
export const handleStopPreviewEmail = [
  celebrate({
    [Segments.BODY]: Joi.object({
      emails: emailsSchema,
      formQuestionAnswers: questionAnswersSchema,
    }),
  }),
  createPreviewEmailHandler<{
    emails: string[]
    formQuestionAnswers: QuestionAnswer[]
  }>('sendStopPreviewEmail', ({ form, formId, submissionId, body }) =>
    MailService.sendMrfWorkflowStoppedEmail({
      emails: body.emails,
      formId,
      formTitle: form.title,
      responseId: submissionId,
      submissionId,
      timestamp: moment()
        .tz('Asia/Singapore')
        .format('ddd, D MMM YYYY, hh:mm:ss A'),
      formQuestionAnswers: body.formQuestionAnswers,
      responseJson: JSON.stringify(
        Object.fromEntries(
          body.formQuestionAnswers.map(({ question, answer }) => [
            question,
            answer,
          ]),
        ),
      ),
    }),
  ),
] as ControllerHandler[]

/**
 * POST /:formId/submissions/:submissionId/assignee-email-preview
 * Sends the existing step email to newly added assignees: "Action required"
 * when they are added, the "[Reminder]" version when the admin reminds.
 */
export const handleAssigneeEmailPreview = [
  celebrate({
    [Segments.BODY]: Joi.object({
      emails: emailsSchema,
      submissionSecretKey: Joi.string().required(),
      stepToken: Joi.string(),
      isReminder: Joi.boolean().required(),
      formQuestionAnswers: questionAnswersSchema,
    }),
  }),
  createPreviewEmailHandler<{
    emails: string[]
    submissionSecretKey: string
    stepToken?: string
    isReminder: boolean
    formQuestionAnswers: QuestionAnswer[]
  }>('sendAssigneeEmailPreview', ({ form, formId, submissionId, body }) =>
    MailService.sendMRFWorkflowStepEmail({
      emails: body.emails,
      formId,
      formTitle: form.title,
      responseId: submissionId,
      responseUrl: `${config.app.feAppUrl}/${getMultirespondentSubmissionEditPath(
        formId,
        submissionId,
        { key: body.submissionSecretKey, stepToken: body.stepToken },
      )}`,
      isReminder: body.isReminder,
      // Like the real emails: the action email includes the responses, the
      // reminder does not.
      ...(body.isReminder
        ? {}
        : { formQuestionAnswers: body.formQuestionAnswers }),
    }),
  ),
] as ControllerHandler[]
