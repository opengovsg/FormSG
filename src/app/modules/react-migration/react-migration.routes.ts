import { Router } from 'express'

import config from '../../config/config'
import * as HomeController from '../home/home.controller'

export const ReactMigrationRouter = Router()

const REACT_ROLLOUT_THRESHOLD = 20 / 100

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: !config.isDev,
}

ReactMigrationRouter.get('/:formId([a-fA-F0-9]{24})', (req, res, next) => {
  console.log('conditional routing')

  // check cookies
  let serveReact

  if (req.cookies && 'frontend' in req.cookies) {
    serveReact = req.cookies.frontend === 'react'
  } else {
    serveReact = Math.random() < REACT_ROLLOUT_THRESHOLD
  }

  res.cookie(
    'frontend',
    serveReact ? 'react' : 'angular',
    SESSION_COOKIE_OPTIONS,
  )

  if (serveReact) {
    // serve react
  } else {
    return HomeController.home(req, res, next)
  }
})
