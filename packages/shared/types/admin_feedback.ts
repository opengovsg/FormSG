import { UserDto } from './user'

export type AdminFeedbackTriggerSource = 'field-edit' | 'publish' | 'workflow'

export type AdminFeedbackRating = 1 | 2 | 3 | 4 | 5

export type AdminFeedbackBase = {
  /** @deprecated Legacy thumbs (0/1) key. Kept for historical rows; new rows use `csat`. */
  rating?: number
  /** CSAT: the 1-5 star satisfaction score. Own key so it never mixes with legacy `rating`. */
  csat?: AdminFeedbackRating
  comment?: string
  triggerSource?: AdminFeedbackTriggerSource
  formId?: string
  /** True if the feedback was edited (star or comment) after creation. */
  feedbackChanged?: boolean
  userId?: UserDto['_id']
  created?: Date
  lastModified?: Date
}

export type AdminFeedbackDto = AdminFeedbackBase & { _id: string }
