import { Router } from 'express'

import { handleRedirectURLRequest } from './myinfo.controller'

export const MyInfoRouter = Router()

MyInfoRouter.get('/redirect', handleRedirectURLRequest)
