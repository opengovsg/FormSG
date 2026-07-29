import { UserDto } from './user'

export const ADMIN_FEEDBACK_TRIGGER_SOURCES = [
  'field-edit',
  'publish',
  'workflow',
] as const

export type AdminFeedbackTriggerSource =
  (typeof ADMIN_FEEDBACK_TRIGGER_SOURCES)[number]

/** The 1-5 CSAT scale. Distinct from legacy thumbs `rating`. */
export type AdminCsatScore = 1 | 2 | 3 | 4 | 5

export type AdminFeedbackBase = {
  /** @deprecated Legacy thumbs (0/1). Historical rows only; new rows use `csat`. */
  rating?: number
  /** CSAT 1-5. Own key so it never mixes with legacy `rating`. */
  csat?: AdminCsatScore
  comment?: string
  triggerSource?: AdminFeedbackTriggerSource
  formId?: string
  ratingChanged?: boolean
  userId?: UserDto['_id']
  created?: Date
  lastModified?: Date
}

export type AdminFeedbackDto = AdminFeedbackBase & { _id: string }

/** @deprecated Remove when the star rating UI (#9692) lands. */
export enum AdminFeedbackRating {
  up = 1,
  down = 0,
}
