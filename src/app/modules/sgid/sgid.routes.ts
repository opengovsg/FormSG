import { Router } from 'express'

import { handleLogin } from './sgid.controller'
import { validateLoginRequest } from './sgid.middlewares'

export const SgidRouter = Router()

SgidRouter.get('/login', validateLoginRequest, handleLogin)
