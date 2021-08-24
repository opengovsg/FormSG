import { IUserSchema } from 'src/types'

declare global {
  namespace Express {
    export interface Request {
      id?: string
    }
  }
}

declare module 'express-session' {
  export interface SessionData {
    user?: {
      _id: IUserSchema['_id']
    }
  }

  export interface AuthedSessionData extends SessionData {
    user: {
      _id: IUserSchema['_id']
    }
  }
}
