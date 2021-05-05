import { IUserSchema } from '@root/types'

declare global {
  namespace Express {
    export interface Request {
      id?: string
    }

    export interface Session {
      user?: IUserSchema
    }

    export interface AuthedSession extends Session {
      user: IUserSchema
    }
  }
}
