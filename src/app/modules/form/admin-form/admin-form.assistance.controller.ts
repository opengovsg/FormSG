import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import { StatusCodes } from 'http-status-codes'
import { featureFlags } from 'shared/constants'

import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import * as AuthService from '../../auth/auth.service'
import { ControllerHandler } from '../../core/core.types'
import * as UserService from '../../user/user.service'

import {
  createFormFieldsUsingTextPrompt,
  createFormFieldsUsingVisionPrompt,
} from './admin-form.assistance.service'
import { PermissionLevel } from './admin-form.types'
import { mapRouteError } from './admin-form.utils'

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
  { message: string; createdFieldIds?: string[] },
  ITextPrompt
> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id

  const gb = req.growthbook

  if (!gb?.isOn(featureFlags.mfb)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'This feature is currently unavailable.',
    })
  }

  // Step 1: Retrieve currently logged in user.
  return UserService.getPopulatedUserById(sessionUserId)
    .andThen((user) =>
      // Step 2: Retrieve form with write permission check.
      AuthService.getFormAfterPermissionChecks({
        user,
        formId,
        level: PermissionLevel.Write,
      }).map((form) => ({ user, form })),
    )
    .map(({ user, form }) => {
      logger.info({
        message: 'Generating form fields using text prompt',
        meta: {
          action: '_handleTextPrompt',
          ...createReqMeta(req),
          userId: sessionUserId,
          userEmail: user.email,
          formId,
          promptLength: req.body.prompt.length,
        },
      })
      return form
    }) // Step 3: Create form fields using text prompt.
    .andThen((form) =>
      createFormFieldsUsingTextPrompt({
        form,
        userPrompt: req.body.prompt,
      }),
    )
    .map((createdFieldIds) =>
      res.status(StatusCodes.OK).json({
        message: 'Created form fields using text prompt successfully.',
        createdFieldIds: createdFieldIds.map((field) => field._id.toString()),
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
}

export const handleTextPrompt = [
  handleTextPromptValidator,
  _handleTextPrompt,
] as ControllerHandler[]

const handleVisionPromptValidator = celebrate({
  [Segments.PARAMS]: {
    formId: Joi.string()
      .required()
      .pattern(/^[a-fA-F0-9]{24}$/)
      .message('Your form ID is invalid.'),
  },
  [Segments.BODY]: {
    imageDataUrls: Joi.array().items(Joi.string()).required().min(1).max(10),
  },
})

interface IVisionPrompt {
  imageDataUrls: string[]
}

const _handleVisionPrompt: ControllerHandler<
  { formId: string },
  { message: string; createdFieldIds?: string[] },
  IVisionPrompt
> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id
  const { imageDataUrls } = req.body
  const gb = req.growthbook

  if (!gb?.isOn(featureFlags.mfbVision)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'This feature is currently unavailable.',
    })
  }

  // Step 1: Retrieve currently logged in user.
  return (
    UserService.getPopulatedUserById(sessionUserId)
      .andThen((user) =>
        // Step 2: Retrieve form with write permission check.
        AuthService.getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Write,
        }).map((form) => ({ user, form })),
      )
      .map(({ user, form }) => {
        logger.info({
          message: 'Generating form fields using vision prompt',
          meta: {
            action: '_handleVisionPrompt',
            ...createReqMeta(req),
            userId: sessionUserId,
            userEmail: user.email,
            formId,
            numImagesInPrompt: imageDataUrls.length,
          },
        })
        return { form }
      })
      // Step 3: Create form fields using text prompt.
      .andThen(({ form }) =>
        createFormFieldsUsingVisionPrompt({
          form,
          imageDataUrls,
        }),
      )
      .map((createdFieldIds) =>
        res.status(StatusCodes.OK).json({
          message: 'Created form fields using vision prompt successfully.',
          createdFieldIds: createdFieldIds.map((field) => field._id.toString()),
        }),
      )
      .mapErr((error) => {
        logger.error({
          message: 'Error occurred creating form fields using vision prompt.',
          meta: {
            action: '_handleVisionPrompt',
            ...createReqMeta(req),
            userId: sessionUserId,
            formId,
            numImagesInPrompt: req.body.imageDataUrls.length,
          },
          error,
        })
        const { errorMessage, statusCode } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

export const handleVisionPrompt = [
  handleVisionPromptValidator,
  _handleVisionPrompt,
]
