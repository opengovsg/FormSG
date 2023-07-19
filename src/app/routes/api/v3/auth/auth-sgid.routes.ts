import { Router } from 'express'

import {
  generateAuthUrl,
  handleLogin,
} from '../../../../modules/auth/sgid/auth-sgid.controller'

export const AuthSGIDRouter = Router()

AuthSGIDRouter.get('/generateAuthUrl', generateAuthUrl)

AuthSGIDRouter.get('/login', handleLogin)
