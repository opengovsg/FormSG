import { UserDto } from './user'

export type AdminFeedbackTriggerSource = 'field-edit' | 'publish' | 'workflow'

/** The 1-5 CSAT scale. Deliberately distinct from the legacy thumbs enum. */
export type AdminCsatScore = 1 | 2 | 3 | 4 | 5

export type AdminFeedbackBase = {
  /** @deprecated Legacy thumbs (0/1) key. Kept for historical rows; new rows use `csat`. */
  rating?: number
  /** CSAT: the 1-5 star satisfaction score. Own key so it never mixes with legacy `rating`. */
  csat?: AdminCsatScore
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

/**
 * @deprecated Legacy thumbs UI. Still live on develop, so this enum must stay a
 * runtime value until the star rating UI (#9692) replaces it.
 */
export enum AdminFeedbackRating {
  up = 1,
  down = 0,
}
