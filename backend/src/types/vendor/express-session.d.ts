import { IUserSchema } from 'src/types'

declare module 'express-session' {
  interface SessionData {
    user: IUserSchema
  }
}
