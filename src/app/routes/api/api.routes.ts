import { Router } from 'express'

import { errorHandlerMiddlewares } from '../../loaders/express/error-handler'

import { V1ExternalRouter } from './external/v1'
import { V3Router } from './v3'

export const ApiRouter = Router()

ApiRouter.use('/v3', V3Router)
ApiRouter.use('/external/v1', V1ExternalRouter)
ApiRouter.use(errorHandlerMiddlewares())
