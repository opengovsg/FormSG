import { IAgencySchema } from 'src/types'

import { ResponseWithLocals } from '../core/core.types'

/**
 *  Meta typing for the shape of the Express.Response object after various
 *  middlewares for /auth.
 */
export type ResponseAfter = {
  validateDomain: ResponseWithLocals<{ agency?: IAgencySchema }>
}
