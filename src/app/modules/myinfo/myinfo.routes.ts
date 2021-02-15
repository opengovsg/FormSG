import { Router } from 'express'

import { MYINFO_REDIRECT_PATH } from './myinfo.constants'
import {
  handleEServiceIdCheck,
  handleMyInfoLogin,
  handleRedirectURLRequest,
} from './myinfo.controller'

export const MyInfoRouter = Router()

MyInfoRouter.get('/redirect', handleRedirectURLRequest)

MyInfoRouter.get('/validate', handleEServiceIdCheck)

MyInfoRouter.get(MYINFO_REDIRECT_PATH, handleMyInfoLogin)
