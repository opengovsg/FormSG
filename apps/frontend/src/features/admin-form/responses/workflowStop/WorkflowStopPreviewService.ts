import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

import { DecryptedResponseLike } from './getStopNotifiedEmails'

/** Flattens decrypted answers into the question/answer pairs emails use. */
const toQuestionAnswers = (responses: DecryptedResponseLike[] = []) =>
  responses.flatMap(({ question, answer, answerArray, fieldType }) =>
    typeof question === 'string'
      ? [
          {
            question,
            answer:
              typeof answer === 'string'
                ? answer
                : Array.isArray(answerArray)
                  ? answerArray.flat().join(', ')
                  : '',
            ...(typeof fieldType === 'string' ? { fieldType } : {}),
          },
        ]
      : [],
  )

const previewEndpoint = (formId: string, submissionId: string) =>
  `${ADMIN_FORM_ENDPOINT}/${formId}/submissions/${submissionId}`

// The preview email endpoints only exist on a local dev server. Elsewhere (e.g.
// a Render preview) the prototype skips the emails instead of erroring.
const canSendPreviewEmails = import.meta.env.MODE === 'development'

/**
 * DESIGN PREVIEW ONLY (local dev): asks the backend to send the "workflow
 * stopped" email. Nothing is stopped server-side.
 * TODO(workflow-stop): replace with the real stop endpoint.
 */
export const sendStopPreviewEmail = ({
  formId,
  submissionId,
  emails,
  responses,
}: {
  formId: string
  submissionId: string
  emails: string[]
  responses?: DecryptedResponseLike[]
}): Promise<void> =>
  !canSendPreviewEmails
    ? Promise.resolve()
    : ApiService.post(
        `${previewEndpoint(formId, submissionId)}/stop-preview-email`,
        { emails, formQuestionAnswers: toQuestionAnswers(responses) },
      ).then(() => undefined)

/**
 * DESIGN PREVIEW ONLY (local dev): sends the existing step email to assignees
 * added in the preview. "Action required" when they are added, "[Reminder]"
 * when the admin sends a reminder.
 * TODO(workflow-stop): delete once assignees are stored on the step.
 */
export const sendAssigneeStepEmailPreview = ({
  formId,
  submissionId,
  emails,
  submissionSecretKey,
  stepToken,
  isReminder,
  responses,
}: {
  formId: string
  submissionId: string
  emails: string[]
  submissionSecretKey: string
  stepToken?: string
  isReminder: boolean
  responses?: DecryptedResponseLike[]
}): Promise<void> =>
  !canSendPreviewEmails
    ? Promise.resolve()
    : ApiService.post(
        `${previewEndpoint(formId, submissionId)}/assignee-email-preview`,
        {
          emails,
          submissionSecretKey,
          ...(stepToken ? { stepToken } : {}),
          isReminder,
          formQuestionAnswers: isReminder ? [] : toQuestionAnswers(responses),
        },
      ).then(() => undefined)
