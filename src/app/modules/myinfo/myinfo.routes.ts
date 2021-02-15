import { Router } from 'express'

import {
  handleEServiceIdCheck,
  handleRedirectURLRequest,
} from './myinfo.controller'

export const MyInfoRouter = Router()

MyInfoRouter.get('/redirect', handleRedirectURLRequest)

MyInfoRouter.get('/validate', handleEServiceIdCheck)
