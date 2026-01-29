import { Router } from 'express'

import { rateLimitConfig } from '../../../../../config/config'
import {
  handleAnalyzeQuestion,
  handleAutoSummary,
  handleAutoSummaryStream,
  handleInterpretData,
  handleInterpretDataStream,
  handleSuggestedQuestions,
  handleTextPrompt,
  handleVisionPrompt,
} from '../../../../../modules/form/admin-form/admin-form.assistance.controller'
import { limitRate } from '../../../../../utils/limit-rate'

export const AdminFormsAssistanceRouter = Router()

AdminFormsAssistanceRouter.post(
  '/:formId([a-fA-F0-9]{24})/assistance/text-prompt',
  limitRate({ max: rateLimitConfig.makeTextPrompt }),
  handleTextPrompt,
)

AdminFormsAssistanceRouter.post(
  '/:formId([a-fA-F0-9]{24})/assistance/vision-prompt',
  limitRate({ max: rateLimitConfig.makeVisionPrompt }),
  handleVisionPrompt,
)

// Step 1: Analyze question to determine relevant fields and filters
AdminFormsAssistanceRouter.post(
  '/:formId([a-fA-F0-9]{24})/assistance/analyze-question',
  limitRate({ max: rateLimitConfig.interpretData }),
  handleAnalyzeQuestion,
)

// Suggested questions for exploring data (UI helper)
AdminFormsAssistanceRouter.get(
  '/:formId([a-fA-F0-9]{24})/assistance/suggested-questions',
  limitRate({ max: rateLimitConfig.interpretData }),
  handleSuggestedQuestions,
)

// Step 2: Interpret data with filtered responses
AdminFormsAssistanceRouter.post(
  '/:formId([a-fA-F0-9]{24})/assistance/interpret-data',
  limitRate({ max: rateLimitConfig.interpretData }),
  handleInterpretData,
)

// Step 2 (streaming): Interpret data with SSE streaming response
AdminFormsAssistanceRouter.post(
  '/:formId([a-fA-F0-9]{24})/assistance/interpret-data-stream',
  limitRate({ max: rateLimitConfig.interpretData }),
  handleInterpretDataStream,
)

// Auto-summary endpoint
AdminFormsAssistanceRouter.post(
  '/:formId([a-fA-F0-9]{24})/assistance/auto-summary',
  limitRate({ max: rateLimitConfig.interpretData }),
  handleAutoSummary,
)

// Auto-summary streaming endpoint (SSE)
AdminFormsAssistanceRouter.post(
  '/:formId([a-fA-F0-9]{24})/assistance/auto-summary-stream',
  limitRate({ max: rateLimitConfig.interpretData }),
  handleAutoSummaryStream,
)
