import { Router } from 'express'

import * as ExamplesController from './examples.controller'

export const ExamplesRouter = Router()

ExamplesRouter.get('/', ExamplesController.handleGetExamples)

ExamplesRouter.get(
  '/:formId([a-fA-F0-9]{24})',
  ExamplesController.handleGetExampleByFormId,
)
