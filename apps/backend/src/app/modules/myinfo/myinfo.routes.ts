import { Router } from 'express'

import { MyInfoFapiRouter } from './fapi/myinfo.fapi.routes'

export const MyInfoRouter = Router()

/**
 * Routes for MyInfo v5 FAPI endpoints
 * @route /mi
 */
MyInfoRouter.use(MyInfoFapiRouter)
