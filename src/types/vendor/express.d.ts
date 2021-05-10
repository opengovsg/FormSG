import { IUserSchema } from 'src/types'

declare global {
  namespace Express {
    export interface Request {
      id?: string
    }

    export interface Session {
      user?: IUserSchema['_id']
    }

    export interface AuthedSession extends Session {
      user: IUserSchema['_id']
    }
  }
}
