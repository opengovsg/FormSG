import { UserDto } from './user'

export type AdminFeedbackBase = {
  rating: number
  comment?: string
  userId?: UserDto['_id']
  created?: Date
  lastModified?: Date
}

export type AdminFeedbackDto = AdminFeedbackBase & { _id: string }