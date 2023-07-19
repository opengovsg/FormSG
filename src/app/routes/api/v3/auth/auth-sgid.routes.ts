import { Router } from 'express'

import * as AuthSgidController from '../../../../modules/auth/sgid/auth-sgid.controller'

export const AuthSGIDRouter = Router()

AuthSGIDRouter.get('/authUrl', AuthSgidController.generateAuthUrl)

AuthSGIDRouter.get('/login', AuthSgidController.handleLogin)
