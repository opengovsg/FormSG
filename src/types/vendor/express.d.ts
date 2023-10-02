import { RateLimitInfo } from 'express-rate-limit'

import { SgidUser } from '../../app/modules/auth/auth.types'
import { EncryptSubmissionDto } from '../api'
import { IPopulatedEncryptedForm, IPopulatedForm, IUserSchema } from '../types'

declare global {
  namespace Express {
    export interface Request {
      id?: string
      /**
       * This property is added to all requests with the `limit`, `current`,
       * and `remaining` number of requests and, if the store provides it, a `resetTime` Date object.
       * These may be used in your application code to take additional actions or inform the user of their status
       *
       * The property name can be configured with the configuration option `requestPropertyName`.
       *
       * !! If `requestPropertyName` is set to anything other than `rateLimit`, you must also update this key option to the new name.
       *
       * @note this is not in the official types for some reason, but it exists in their docs.
       * @see https://github.com/nfriedly/express-rate-limit#request-api
       */
      rateLimit: RateLimitInfo
      /**
       * This property is added by storage mode submission middlewares to store context shared between middlewares.
       */
      formsg?: {
        formDef?: IPopulatedForm
        encryptedPayload?: EncryptSubmissionDto
        encryptedFormDef?: IPopulatedEncryptedForm
      }
    }
  }
}

declare module 'express-session' {
  export interface SessionData {
    user?: {
      _id: IUserSchema['_id']
    }
    sgid?: SgidUser
  }

  export interface AuthedSessionData extends SessionData {
    user: {
      _id: IUserSchema['_id']
    }
  }
}
