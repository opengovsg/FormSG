import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import { StatusCodes } from 'http-status-codes'

import {
  featureFlags,
  INTERPRET_DATA_MAX_RESPONSES,
  INTERPRET_DATA_QUESTION_MAX_CHAR,
  MFB_TEXT_PROMPT_MAX_CHAR,
  MFB_VISION_MAX_IMAGES_COUNT,
} from '../../../../../shared/constants'
import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import * as AuthService from '../../auth/auth.service'
import { ControllerHandler } from '../../core/core.types'
import * as UserService from '../../user/user.service'

import {
  analyzeQuestionForRelevantFields,
  createFormFieldsUsingTextPrompt,
  createFormFieldsUsingVisionPrompt,
  generateAutoSummary,
  generateSuggestedQuestions,
  interpretResponseData,
  interpretResponseDataStreaming,
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
    prompt: Joi.string().required().max(MFB_TEXT_PROMPT_MAX_CHAR),
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
    imageDataUrls: Joi.array()
      .items(Joi.string())
      .required()
      .min(1)
      .max(MFB_VISION_MAX_IMAGES_COUNT),
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

// ============================================
// Analyze Question Endpoint (Step 1 of 2-step flow)
// ============================================

const handleAnalyzeQuestionValidator = celebrate({
  [Segments.PARAMS]: {
    formId: Joi.string()
      .required()
      .pattern(/^[a-fA-F0-9]{24}$/)
      .message('Your form ID is invalid.'),
  },
  [Segments.BODY]: {
    question: Joi.string().required().max(INTERPRET_DATA_QUESTION_MAX_CHAR),
  },
})

interface IAnalyzeQuestion {
  question: string
}

const _handleAnalyzeQuestion: ControllerHandler<
  { formId: string },
  {
    message: string
    relevantFieldIds?: string[]
    suggestedFilters?: Array<{
      fieldId: string
      operator: 'contains' | 'equals'
      value: string
    }>
    reasoning?: string
  },
  IAnalyzeQuestion
> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id
  const { question } = req.body
  const gb = req.growthbook

  if (!gb?.isOn(featureFlags.mfb)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'This feature is currently unavailable.',
    })
  }

  // Step 1: Retrieve currently logged in user.
  return (
    UserService.getPopulatedUserById(sessionUserId)
      .andThen((user) =>
        // Step 2: Retrieve form with read permission check.
        AuthService.getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Read,
        }),
      )
      // Step 3: Analyze question to find relevant fields.
      .andThen((form) =>
        analyzeQuestionForRelevantFields({
          form,
          question,
        }),
      )
      .map((result) =>
        res.status(StatusCodes.OK).json({
          message: 'Question analyzed successfully.',
          relevantFieldIds: result.relevantFieldIds,
          suggestedFilters: result.suggestedFilters,
          reasoning: result.reasoning,
        }),
      )
      .mapErr((error) => {
        logger.error({
          message: 'Error occurred analyzing question.',
          meta: {
            action: '_handleAnalyzeQuestion',
            ...createReqMeta(req),
            userId: sessionUserId,
            formId,
            question,
            errorType: error.constructor.name,
            errorMessage: error.message,
          },
          error,
        })
        const { errorMessage, statusCode } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

export const handleAnalyzeQuestion = [
  handleAnalyzeQuestionValidator,
  _handleAnalyzeQuestion,
] as ControllerHandler[]

// ============================================
// Suggested Questions Endpoint
// ============================================

const handleSuggestedQuestionsValidator = celebrate({
  [Segments.PARAMS]: {
    formId: Joi.string()
      .required()
      .pattern(/^[a-fA-F0-9]{24}$/)
      .message('Your form ID is invalid.'),
  },
})

const _handleSuggestedQuestions: ControllerHandler<
  { formId: string },
  { message: string; suggestedQuestions?: string[] }
> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id
  const gb = req.growthbook

  if (!gb?.isOn(featureFlags.mfb)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'This feature is currently unavailable.',
    })
  }

  return UserService.getPopulatedUserById(sessionUserId)
    .andThen((user) =>
      AuthService.getFormAfterPermissionChecks({
        user,
        formId,
        level: PermissionLevel.Read,
      }),
    )
    .andThen((form) => generateSuggestedQuestions({ form }))
    .map((result) =>
      res.status(StatusCodes.OK).json({
        message: 'Suggested questions generated successfully.',
        suggestedQuestions: result.suggestedQuestions,
      }),
    )
    .mapErr((error) => {
      logger.error({
        message: 'Error occurred generating suggested questions.',
        meta: {
          action: '_handleSuggestedQuestions',
          ...createReqMeta(req),
          userId: sessionUserId,
          formId,
          errorType: error.constructor.name,
          errorMessage: error.message,
        },
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

export const handleSuggestedQuestions = [
  handleSuggestedQuestionsValidator,
  _handleSuggestedQuestions,
] as ControllerHandler[]

// ============================================
// Interpret Data Endpoint (Step 2 of 2-step flow)
// ============================================

const handleInterpretDataValidator = celebrate({
  [Segments.PARAMS]: {
    formId: Joi.string()
      .required()
      .pattern(/^[a-fA-F0-9]{24}$/)
      .message('Your form ID is invalid.'),
  },
  [Segments.BODY]: {
    question: Joi.string().required().max(INTERPRET_DATA_QUESTION_MAX_CHAR),
    responses: Joi.array()
      .items(
        Joi.object({
          refNo: Joi.string().required(),
          submissionTime: Joi.string().required(),
          fields: Joi.array()
            .items(
              Joi.object({
                fieldId: Joi.string().required(),
                answer: Joi.string().allow('').required(),
              }),
            )
            .required(),
        }),
      )
      .required()
      .max(INTERPRET_DATA_MAX_RESPONSES),
  },
})

interface IInterpretDataField {
  fieldId: string
  answer: string
}

interface IInterpretDataResponse {
  refNo: string
  submissionTime: string
  fields: IInterpretDataField[]
}

interface IInterpretData {
  question: string
  responses: IInterpretDataResponse[]
}

interface ISuggestedChart {
  chartType: 'pie' | 'bar' | 'column' | 'line'
  title: string
  data: { label: string; value: number }[] // Array of objects with label and value
}

const _handleInterpretData: ControllerHandler<
  { formId: string },
  {
    message: string
    answer?: string
    explanation?: string
    mentionedResponseIds?: string[]
    suggestedCharts?: ISuggestedChart[]
    suggestedFollowUps?: string[]
  },
  IInterpretData
> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id
  const { question, responses } = req.body
  const gb = req.growthbook

  if (!gb?.isOn(featureFlags.mfb)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'This feature is currently unavailable.',
    })
  }

  // Step 1: Retrieve currently logged in user.
  return (
    UserService.getPopulatedUserById(sessionUserId)
      .andThen((user) =>
        // Step 2: Retrieve form with read permission check.
        AuthService.getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Read,
        }).map((form) => ({ user, form })),
      )
      .map(({ user, form }) => {
        logger.info({
          message: 'Interpreting response data with AI',
          meta: {
            action: '_handleInterpretData',
            ...createReqMeta(req),
            userId: sessionUserId,
            userEmail: user.email,
            formId,
            questionLength: question.length,
            responsesCount: responses.length,
          },
        })
        return form
      })
      // Step 3: Interpret response data.
      .andThen((form) =>
        interpretResponseData({
          form,
          question,
          responses,
        }),
      )
      .map((result) =>
        res.status(StatusCodes.OK).json({
          message: 'Data interpreted successfully.',
          answer: result.answer,
          explanation: result.explanation,
          mentionedResponseIds: result.mentionedResponseIds,
          suggestedCharts: result.suggestedCharts,
          suggestedFollowUps: result.suggestedFollowUps,
        }),
      )
      .mapErr((error) => {
        logger.error({
          message: 'Error occurred interpreting response data.',
          meta: {
            action: '_handleInterpretData',
            ...createReqMeta(req),
            userId: sessionUserId,
            formId,
            question,
          },
          error,
        })
        const { errorMessage, statusCode } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

export const handleInterpretData = [
  handleInterpretDataValidator,
  _handleInterpretData,
] as ControllerHandler[]

// ============================================
// Interpret Data Streaming Endpoint (SSE)
// ============================================

const _handleInterpretDataStream: ControllerHandler<
  { formId: string },
  void, // SSE doesn't use standard response type
  IInterpretData
> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id
  const { question, responses } = req.body
  const gb = req.growthbook

  if (!gb?.isOn(featureFlags.mfb)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'This feature is currently unavailable.',
    })
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering
  res.flushHeaders()

  // Helper to send SSE events
  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // Handle client disconnect
  let isClientConnected = true
  req.on('close', () => {
    isClientConnected = false
    logger.info({
      message: 'Client disconnected from streaming endpoint',
      meta: {
        action: '_handleInterpretDataStream',
        formId,
      },
    })
  })

  try {
    // Step 1: Auth checks
    const userResult = await UserService.getPopulatedUserById(sessionUserId)
    if (userResult.isErr()) {
      sendEvent('error', { message: 'User not found' })
      res.end()
      return
    }

    const formResult = await AuthService.getFormAfterPermissionChecks({
      user: userResult.value,
      formId,
      level: PermissionLevel.Read,
    })
    if (formResult.isErr()) {
      sendEvent('error', { message: 'Form not found or no permission' })
      res.end()
      return
    }

    const form = formResult.value

    logger.info({
      message: 'Starting streaming interpretation of response data',
      meta: {
        action: '_handleInterpretDataStream',
        formId,
        questionLength: question.length,
        responsesCount: responses.length,
      },
    })

    // Step 2: Stream the interpretation
    const streamResult = await interpretResponseDataStreaming({
      form,
      question,
      responses,
      onChunk: (chunk) => {
        if (isClientConnected) {
          sendEvent('chunk', { content: chunk })
        }
      },
      onPartialAnswer: (answer) => {
        if (isClientConnected) {
          sendEvent('partial_answer', { answer })
        }
      },
    })

    if (streamResult.isErr()) {
      sendEvent('error', { message: streamResult.error.message })
      res.end()
      return
    }

    // Send final complete result
    if (isClientConnected) {
      sendEvent('complete', streamResult.value)
    }
    res.end()
  } catch (error) {
    logger.error({
      message: 'Error in streaming interpretation',
      meta: {
        action: '_handleInterpretDataStream',
        formId,
      },
      error,
    })
    if (isClientConnected) {
      sendEvent('error', {
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
    res.end()
  }
}

export const handleInterpretDataStream = [
  handleInterpretDataValidator, // Reuse same validator
  _handleInterpretDataStream,
] as ControllerHandler[]

// ============================================
// Auto Summary Endpoint
// ============================================

const handleAutoSummaryValidator = celebrate({
  [Segments.PARAMS]: {
    formId: Joi.string()
      .required()
      .pattern(/^[a-fA-F0-9]{24}$/)
      .message('Your form ID is invalid.'),
  },
  [Segments.BODY]: {
    responses: Joi.array()
      .items(
        Joi.object({
          refNo: Joi.string().required(),
          submissionTime: Joi.string().required(),
          fields: Joi.array()
            .items(
              Joi.object({
                fieldId: Joi.string().required(),
                answer: Joi.string().allow('').required(),
              }),
            )
            .required(),
        }),
      )
      .required()
      .max(INTERPRET_DATA_MAX_RESPONSES),
  },
})

interface IAutoSummaryField {
  fieldId: string
  answer: string
}

interface IAutoSummaryResponse {
  refNo: string
  submissionTime: string
  fields: IAutoSummaryField[]
}

interface IAutoSummary {
  responses: IAutoSummaryResponse[]
}

const _handleAutoSummary: ControllerHandler<
  { formId: string },
  {
    message: string
    summary?: string
    keyFindings?: string[]
    suggestedQuestions?: string[]
  },
  IAutoSummary
> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id
  const { responses } = req.body
  const gb = req.growthbook

  if (!gb?.isOn(featureFlags.mfb)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'This feature is currently unavailable.',
    })
  }

  return UserService.getPopulatedUserById(sessionUserId)
    .andThen((user) =>
      AuthService.getFormAfterPermissionChecks({
        user,
        formId,
        level: PermissionLevel.Read,
      }).map((form) => ({ user, form })),
    )
    .map(({ user, form }) => {
      logger.info({
        message: 'Generating auto-summary for form responses',
        meta: {
          action: '_handleAutoSummary',
          ...createReqMeta(req),
          userId: sessionUserId,
          userEmail: user.email,
          formId,
          responsesCount: responses.length,
        },
      })
      return form
    })
    .andThen((form) =>
      generateAutoSummary({
        form,
        responses,
      }),
    )
    .map((result) =>
      res.status(StatusCodes.OK).json({
        message: 'Auto-summary generated successfully.',
        summary: result.summary,
        keyFindings: result.keyFindings,
        suggestedQuestions: result.suggestedQuestions,
      }),
    )
    .mapErr((error) => {
      logger.error({
        message: 'Error occurred generating auto-summary.',
        meta: {
          action: '_handleAutoSummary',
          ...createReqMeta(req),
          userId: sessionUserId,
          formId,
        },
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

export const handleAutoSummary = [
  handleAutoSummaryValidator,
  _handleAutoSummary,
] as ControllerHandler[]
