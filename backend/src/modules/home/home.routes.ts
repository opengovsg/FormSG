import { Router } from 'express'

import * as HomeController from './home.controller'

export const HomeRouter = Router()

HomeRouter.get('/', HomeController.home)
