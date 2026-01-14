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

export interface InterpretDataField {
  fieldId: string
  question: string
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

export interface InterpretDataResult {
  message: string
  answer: string
  explanation: string
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
