import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import { ErrorDto, PrivateFormErrorDto } from 'shared/types'

import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'
import { PrivateFormError } from '../form/form.errors'
import * as FormService from '../form/form.service'

import { insertFormIssue, notifyFormAdmin } from './issue.service'
import { mapRouteError } from './issue.util'

const logger = createLoggerWithLabel(module)

const validateSubmitFormIssueParams = celebrate({
  [Segments.BODY]: Joi.object().keys({
    issue: Joi.string().trim().required(),
    email: Joi.string()
      .trim()
      .email()
      .message('Please enter a valid email')
      .lowercase(),
  }),
})

const submitFormIssue: ControllerHandler<
  { formId: string },
  { message: string } | ErrorDto | PrivateFormErrorDto,
  { issue: string; email: string }
> = async (req, res) => {
  const { formId } = req.params
  const { issue, email } = req.body
  const logMeta = {
    action: 'submitFormIssue',
    ...createReqMeta(req),
    formId,
  }

  return FormService.retrieveFormKeysById(formId, [
    '_id',
    'admin',
    'inactiveMessage',
    'permissionList',
    'status',
    'title',
  ])
    .andThen((form) => FormService.isFormPublic(form).map(() => form))
    .andThen((form) =>
      insertFormIssue({
        formId: form._id,
        issue: issue,
        email: email,
      }).map(async (formIssue) => {
        await notifyFormAdmin({ form: form, formIssue: formIssue })
      }),
    )
    .map(async () => {
      return res
        .status(StatusCodes.OK)
        .json({ message: 'Successfully submitted issue.' })
    })
    .mapErr((error) => {
      const { errorMessage, statusCode } = mapRouteError(error)
      logger.error({
        message: 'Error occurred while submitting form issue',
        meta: logMeta,
        error,
      })

      // Specialized error response for PrivateFormError.
      if (error instanceof PrivateFormError) {
        return res.status(statusCode).json({
          message: error.message,
          // Flag to prevent default 404 subtext ("please check link") from showing.
          isPageFound: true,
          formTitle: error.formTitle,
        })
      }
      return res.status(statusCode).json({ message: errorMessage })
    })
}

export const submitFormIssueForTesting = submitFormIssue

export const handleSubmitFormIssue = [
  validateSubmitFormIssueParams,
  submitFormIssue,
] as ControllerHandler[]
