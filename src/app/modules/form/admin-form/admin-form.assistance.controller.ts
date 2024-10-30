import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import * as AuthService from '../../auth/auth.service'
import { ControllerHandler } from '../../core/core.types'
import * as UserService from '../../user/user.service'

import { createFormFieldsUsingTextPrompt } from './admin-form.assistance.service'
import { PermissionLevel } from './admin-form.types'
import { mapRouteError, verifyUserBetaflag } from './admin-form.utils'

const logger = createLoggerWithLabel(module)

const handleTextPromptValidator = celebrate({
  [Segments.PARAMS]: {
    formId: Joi.string()
      .required()
      .pattern(/^[a-fA-F0-9]{24}$/)
      .message('Your form ID is invalid.'),
  },
  [Segments.BODY]: {
    prompt: Joi.string().required().max(500),
  },
})

interface ITextPrompt {
  prompt: string
}

const _handleTextPrompt: ControllerHandler<
  { formId: string },
  { message: string },
  ITextPrompt
> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id

  // Step 1a: Retrieve currently logged in user.
  return (
    UserService.getPopulatedUserById(sessionUserId)
      // Step 1b: Verify user has mfb betaFlag.
      .andThen((user) => verifyUserBetaflag(user, 'mfb'))
      .andThen((user) =>
        // Step 2: Retrieve form with write permission check.
        AuthService.getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Write,
        }),
      ) // Step 3: Create form fields using text prompt.
      .andThen((form) =>
        createFormFieldsUsingTextPrompt({
          form,
          userPrompt: req.body.prompt,
        }),
      )
      .map(() =>
        res.status(StatusCodes.OK).json({
          message: 'Created form fields using text prompt successfully.',
        }),
      )
      .mapErr((error) => {
        logger.error({
          message: 'Error occurred creating form fields using text prompt.',
          meta: {
            action: '_handleTextPrompt',
            ...createReqMeta(req),
            userId: sessionUserId,
            formId,
            userPrompt: req.body.prompt,
          },
          error,
        })
        const { errorMessage, statusCode } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

export const handleTextPrompt = [
  handleTextPromptValidator,
  _handleTextPrompt,
] as ControllerHandler[]
