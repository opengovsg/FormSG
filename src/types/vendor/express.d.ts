import { IUserSchema } from 'src/types'

declare module 'express' {
  interface Request {
    id?: string
  }
}

declare module 'express-session' {
  interface SessionData {
    user: IUserSchema
  }
}
