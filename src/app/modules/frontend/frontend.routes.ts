import { Router } from 'express'

import * as FrontendController from './frontend.controller'

export const FrontendRouter = Router()

FrontendRouter.get(
  '/:formId([a-fA-F0-9]{24})',
  FrontendController.servePublicForm,
)

FrontendRouter.get('*', FrontendController.serveDefault)
