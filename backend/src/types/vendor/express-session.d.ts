import { IUserSchema } from '@root/types'

declare module 'express-session' {
  interface SessionData {
    user: IUserSchema
  }
}
