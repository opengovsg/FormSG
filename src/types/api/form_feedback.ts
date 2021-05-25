import { ProcessedFeedback } from '../form_feedback'

export type FormFeedbackPostDto = {
  isPreview?: boolean
  rating: number
  comment?: string
}

export type FormFeedbackResponseDto = {
  rating: number
  comment?: string
  formId: string
  created?: Date
  lastModified?: Date
}

export type GetFormFeedbackDto = {
  average?: string
  count: number
  feedback: ProcessedFeedback[]
}
