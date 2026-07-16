import { UserDto } from './user'

export type AdminFeedbackTriggerSource = 'field-edit' | 'publish' | 'workflow'

export type AdminFeedbackBase = {
  rating: number
  comment?: string
  triggerSource?: AdminFeedbackTriggerSource
  formId?: string
  ratingChanged?: boolean
  userId?: UserDto['_id']
  created?: Date
  lastModified?: Date
}

export type AdminFeedbackDto = AdminFeedbackBase & { _id: string }

/** @deprecated Remove when star rating UI PR lands. */
export enum AdminFeedbackRating {
  up = 1,
  down = 0,
}
