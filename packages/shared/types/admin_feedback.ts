import { UserDto } from './user'

export type AdminFeedbackTriggerSource = 'field-edit' | 'publish' | 'workflow'

export type AdminFeedbackRating = 1 | 2 | 3 | 4 | 5

export type AdminFeedbackBase = {
  rating: AdminFeedbackRating
  comment?: string
  triggerSource?: AdminFeedbackTriggerSource
  formId?: string
  ratingChanged?: boolean
  userId?: UserDto['_id']
  created?: Date
  lastModified?: Date
}

export type AdminFeedbackDto = AdminFeedbackBase & { _id: string }
