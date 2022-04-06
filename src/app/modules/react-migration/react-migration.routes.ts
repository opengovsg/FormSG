import { Router } from 'express'

import config from '../../config/config'
import * as HomeController from '../home/home.controller'

export const ReactMigrationRouter = Router()

const RESPONDENT_COOKIE_NAME = 'v2-respondent-ui'
const ADMIN_COOKIE_NAME = 'v2-admin-ui'

const REACT_ROLLOUT_THRESHOLD = 20 / 100

export const RESPONDENT_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: !config.isDev,
}

ReactMigrationRouter.get('/:formId([a-fA-F0-9]{24})', (req, res, next) => {
  console.log('conditional routing')

  // check cookies
  let serveReact

  if (req.cookies) {
    if (ADMIN_COOKIE_NAME in req.cookies) {
      serveReact = req.cookies[ADMIN_COOKIE_NAME] === 'react'
    } else if (RESPONDENT_COOKIE_NAME in req.cookies) {
      serveReact = req.cookies[RESPONDENT_COOKIE_NAME] === 'react'
    }
  }

  if (serveReact === undefined) {
    serveReact = Math.random() < REACT_ROLLOUT_THRESHOLD

    res.cookie(
      RESPONDENT_COOKIE_NAME,
      serveReact ? 'react' : 'angular',
      RESPONDENT_COOKIE_OPTIONS,
    )
  }

  if (serveReact) {
    // serve react
  } else {
    // return HomeController.home(req, res, next)
  }
})
