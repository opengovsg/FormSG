export type ProcessedFeedback = {
  index: number
  timestamp: number
  rating: number
  comment: string
  date: string
  dateShort: string
}

export type FeedbackResponse = {
  average?: string
  count: number
  feedback: ProcessedFeedback[]
}
