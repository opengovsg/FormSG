import { API_BASE_URL, ApiService } from '~services/ApiService'

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

export interface ConversationTurn {
  question: string
  answer: string
}

export interface InterpretDataParams {
  formId: string
  question: string
  responses: InterpretDataResponse[]
  conversationHistory?: ConversationTurn[]
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
  suggestedFollowUps?: string[]
}

export const interpretData = ({
  formId,
  question,
  responses,
  conversationHistory,
}: InterpretDataParams): Promise<InterpretDataResult> => {
  return ApiService.post<InterpretDataResult>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/assistance/interpret-data`,
    { question, responses, conversationHistory },
  ).then(({ data }) => data)
}

// ============================================
// Auto Summary
// ============================================

export interface AutoSummaryParams {
  formId: string
  responses: InterpretDataResponse[]
}

export interface AutoSummaryResult {
  message: string
  summary: string
  keyFindings: string[]
  suggestedQuestions: string[]
}

export const getAutoSummary = ({
  formId,
  responses,
}: AutoSummaryParams): Promise<AutoSummaryResult> => {
  return ApiService.post<AutoSummaryResult>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/assistance/auto-summary`,
    { responses },
  ).then(({ data }) => data)
}

// ============================================
// Streaming Auto Summary (SSE)
// ============================================

export interface StreamingAutoSummaryParams {
  formId: string
  responses: InterpretDataResponse[]
  onChunk?: (chunk: string) => void
  onPartialSummary?: (summary: string) => void
  onComplete?: (result: Omit<AutoSummaryResult, 'message'>) => void
  onError?: (error: Error) => void
}

/**
 * Streaming version of getAutoSummary using Server-Sent Events.
 * Streams the summary text progressively for faster perceived response.
 */
export const getAutoSummaryStreaming = ({
  formId,
  responses,
  onChunk,
  onPartialSummary,
  onComplete,
  onError,
}: StreamingAutoSummaryParams): { abort: () => void } => {
  const abortController = new AbortController()

  const startStream = async () => {
    const url = `${API_BASE_URL}${ADMIN_FORM_ENDPOINT}/${formId}/assistance/auto-summary-stream`
    let isComplete = false

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responses }),
        signal: abortController.signal,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let pendingEvent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const decodedChunk = decoder.decode(value, { stream: true })
        buffer += decodedChunk

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            pendingEvent = line.slice(7)
          } else if (line.startsWith('data: ')) {
            const currentData = line.slice(6)

            if (pendingEvent && currentData) {
              try {
                const data = JSON.parse(currentData)

                switch (pendingEvent) {
                  case 'heartbeat':
                    // Connection verification, no action needed
                    break
                  case 'chunk':
                    onChunk?.(data.content)
                    break
                  case 'partial_summary':
                    onPartialSummary?.(data.summary)
                    break
                  case 'complete':
                    onComplete?.(data)
                    isComplete = true
                    break
                  case 'error':
                    onError?.(new Error(data.message))
                    break
                }
              } catch {
                // Ignore parse errors for incomplete data
              }
            }
            pendingEvent = ''
          } else if (line === '') {
            pendingEvent = ''
          }
        }

        // Stop reading after complete event to prevent errors during stream cleanup
        if (isComplete) break
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      // Only call onError if we haven't already completed successfully
      if (!isComplete) {
        onError?.(error instanceof Error ? error : new Error('Unknown error'))
      }
    }
  }

  startStream()

  return {
    abort: () => abortController.abort(),
  }
}

// ============================================
// Streaming Interpret Data (SSE)
// ============================================

export interface StreamingInterpretDataParams {
  formId: string
  question: string
  responses: InterpretDataResponse[]
  conversationHistory?: ConversationTurn[]
  onChunk?: (chunk: string) => void
  onPartialAnswer?: (answer: string) => void
  onComplete?: (result: InterpretDataResult) => void
  onError?: (error: Error) => void
}

/**
 * Streaming version of interpretData using Server-Sent Events.
 */
export const interpretDataStreaming = ({
  formId,
  question,
  responses,
  conversationHistory,
  onChunk,
  onPartialAnswer,
  onComplete,
  onError,
}: StreamingInterpretDataParams): { abort: () => void } => {
  const abortController = new AbortController()

  const startStream = async () => {
    const url = `${API_BASE_URL}${ADMIN_FORM_ENDPOINT}/${formId}/assistance/interpret-data-stream`
    let isComplete = false

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, responses, conversationHistory }),
        signal: abortController.signal,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      // Persist event state across network chunks to handle split events
      let pendingEvent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const decodedChunk = decoder.decode(value, { stream: true })
        buffer += decodedChunk

        // Parse SSE events from buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            pendingEvent = line.slice(7)
          } else if (line.startsWith('data: ')) {
            const currentData = line.slice(6)

            if (pendingEvent && currentData) {
              try {
                const data = JSON.parse(currentData)

                switch (pendingEvent) {
                  case 'chunk':
                    onChunk?.(data.content)
                    break
                  case 'partial_answer':
                    onPartialAnswer?.(data.answer)
                    break
                  case 'complete':
                    onComplete?.({
                      message: 'Data interpreted successfully.',
                      ...data,
                    })
                    isComplete = true
                    break
                  case 'error':
                    onError?.(new Error(data.message))
                    break
                }
              } catch {
                // Ignore parse errors for incomplete data
              }
            }
            pendingEvent = ''
          } else if (line === '') {
            pendingEvent = ''
          }
        }

        // Stop reading after complete event to prevent errors during stream cleanup
        if (isComplete) break
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      // Only call onError if we haven't already completed successfully
      if (!isComplete) {
        onError?.(error instanceof Error ? error : new Error('Unknown error'))
      }
    }
  }

  startStream()

  return {
    abort: () => abortController.abort(),
  }
}
