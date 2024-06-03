import { ChatResponseMessage } from '@azure/openai/types/openai'
import { Joi } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import { StatusCodes } from 'http-status-codes'

import { PROMPT_CHAR_LIMIT } from '../../../../../shared/constants'
import { ErrorDto } from '../../../../../shared/types'
import { ContentTypes } from '../../../../../shared/types/assistance'
import { createLoggerWithLabel } from '../../../../../src/app/config/logger'
import { createReqMeta } from '../../../../../src/app/utils/request'
import { ControllerHandler } from '../../core/core.types'
import * as UserService from '../../user/user.service'

import {
  generateFormFields,
  generateQuestions,
} from './admin-form.assistance.service'
import { verifyUserBetaflag } from './admin-form.utils'

const logger = createLoggerWithLabel(module)
/**
 * Handler for POST /questions
 * @returns 200 when questions are successfully generated
 * @returns 500 when openai server error occurs
 */

// Validate inputs by the user for form builder:
const generateQuestionsSchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(ContentTypes))
    .required(),
  content: Joi.string().when('type', {
    is: ContentTypes.PROMPT,
    then: Joi.string().max(PROMPT_CHAR_LIMIT).required(),
  }),
})

export const handleGenerateQuestions: ControllerHandler<
  unknown,
  ChatResponseMessage | ErrorDto,
  {
    type: string
    content: string
  }
> = async (req, res) => {
  const { error, value } = generateQuestionsSchema.validate(req.body)

  const sessionUserId = (req.session as AuthedSessionData).user._id

  const logMeta = {
    action: 'handleGenerateQuestions',
    ...createReqMeta(req),
  }

  // Handle the asynchronous result of UserService.findUserById using andThen
  const userResult = await UserService.findUserById(sessionUserId).andThen(
    (user) => verifyUserBetaflag(user, 'mfb'),
  )

  // Check for errors and handle them appropriately
  if (error) {
    logger.error({
      message: 'Error occurred while generating questions.',
      meta: logMeta,
      error: error,
    })
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: error.details[0].message })
  }

  // Check the result of UserService.findUserById and handle errors
  if (userResult.isErr()) {
    logger.error({
      message:
        'Unable to find mfb feature flag for user while generating questions.',
      meta: logMeta,
      error: userResult.error,
    })
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: userResult.error.message })
  }

  // If no errors, proceed with generating questions
  const result = await generateQuestions(value)
  if (result.isErr()) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: result.error.message })
  }
  res.status(StatusCodes.OK).json(result.value)
}

/**
 * Handler for POST /form-fields
 * @returns 200 when form fields are successfully generated
 * @returns 500 when openai server error occurs
 */
export const handleGenerateFormFields: ControllerHandler<
  unknown,
  ChatResponseMessage | ErrorDto,
  {
    content: string
  }
> = async (req, res) => {
  const sessionUserId = (req.session as AuthedSessionData).user._id

  const logMeta = {
    action: 'handleGenerateFormFields',
    ...createReqMeta(req),
  }

  // Handle the asynchronous result of UserService.findUserById using andThen
  const userResult = await UserService.findUserById(sessionUserId).andThen(
    (user) => verifyUserBetaflag(user, 'mfb'),
  )

  if (userResult.isErr()) {
    logger.error({
      message:
        'Unable to find mfb feature flag for user while generating form fields.',
      meta: logMeta,
      error: userResult.error,
    })
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: userResult.error.message })
  }

  const result = await generateFormFields(req.body.content)
  if (result.isErr()) {
    logger.error({
      message: 'Error occurred for while generating form fields.',
      meta: logMeta,
      error: result.error,
    })
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: result.error.message })
  }
  res.status(StatusCodes.OK).json(result.value)
}
