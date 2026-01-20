import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '../common/AdminViewFormService'

export const makeTextPrompt = ({
  formId,
  prompt,
}: {
  formId: string
  prompt: string
}) => {
  return ApiService.post<{ message: string; createdFieldIds?: string[] }>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/assistance/text-prompt`,
    { prompt },
  ).then(({ data }) => data)
}

export const makeVisionPrompt = ({
  formId,
  imageDataUrls,
}: {
  formId: string
  imageDataUrls: string[]
}) => {
  return ApiService.post<{ message: string; createdFieldIds?: string[] }>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/assistance/vision-prompt`,
    { imageDataUrls },
  ).then(({ data }) => data)
}

// ============================================
// Step 1: Analyze Question
// ============================================

export interface AnalyzeQuestionParams {
  formId: string
  question: string
}

export interface SuggestedFilter {
  fieldId: string
  operator: 'contains' | 'equals'
  value: string
}

export interface AnalyzeQuestionResult {
  message: string
  relevantFieldIds: string[]
  suggestedFilters: SuggestedFilter[]
  reasoning: string
}

export const analyzeQuestion = ({
  formId,
  question,
}: AnalyzeQuestionParams): Promise<AnalyzeQuestionResult> => {
  return ApiService.post<AnalyzeQuestionResult>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/assistance/analyze-question`,
    { question },
  ).then(({ data }) => data)
}

// ============================================
// Suggested Questions (UI helper)
// ============================================

export interface SuggestedQuestionsResult {
  message: string
  suggestedQuestions: string[]
}

export const getSuggestedQuestions = ({
  formId,
}: {
  formId: string
}): Promise<SuggestedQuestionsResult> => {
  return ApiService.get<SuggestedQuestionsResult>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/assistance/suggested-questions`,
  ).then(({ data }) => data)
}

// ============================================
// Step 2: Interpret Data
// ============================================

export interface InterpretDataField {
  fieldId: string
  answer: string
}

export interface InterpretDataResponse {
  refNo: string
  submissionTime: string
  fields: InterpretDataField[]
}

export interface InterpretDataParams {
  formId: string
  question: string
  responses: InterpretDataResponse[]
}

export interface SuggestedChart {
  chartType: 'pie' | 'bar' | 'column' | 'line'
  title: string
  data: { label: string; value: number }[] // Array of objects with label and value
}

export interface InterpretDataResult {
  message: string
  answer: string
  explanation: string
  mentionedResponseIds?: string[]
  suggestedCharts?: SuggestedChart[]
}

export const interpretData = ({
  formId,
  question,
  responses,
}: InterpretDataParams): Promise<InterpretDataResult> => {
  return ApiService.post<InterpretDataResult>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/assistance/interpret-data`,
    { question, responses },
  ).then(({ data }) => data)
}
