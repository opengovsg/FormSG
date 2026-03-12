import { Router } from 'express'

import { authCallbackForwardingMiddleware } from '../auth/auth.middlewares'

import { handleLogin } from './sgid.controller'
import { validateLoginRequest } from './sgid.middlewares'

export const SgidRouter = Router()

SgidRouter.get(
  '/login',
  authCallbackForwardingMiddleware,
  validateLoginRequest,
  handleLogin,
)
