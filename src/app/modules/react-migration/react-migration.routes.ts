import { Router } from 'express'
import path from 'path'

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

function serveReact(req, res, next) {
  const reactFrontendPath = path.resolve('dist/frontend')
  res.sendFile(path.join(reactFrontendPath, 'index.html'))
}

function serveAngular(req, res, next) {}

ReactMigrationRouter.get('/:formId([a-fA-F0-9]{24})', (req, res, next) => {
  console.log('conditional routing 2')

  // check cookies
  let showReact

  if (req.cookies) {
    if (ADMIN_COOKIE_NAME in req.cookies) {
      showReact = req.cookies[ADMIN_COOKIE_NAME] === 'react'
    } else if (RESPONDENT_COOKIE_NAME in req.cookies) {
      showReact = req.cookies[RESPONDENT_COOKIE_NAME] === 'react'
    }
  }

  if (showReact === undefined) {
    showReact = Math.random() < REACT_ROLLOUT_THRESHOLD

    res.cookie(
      RESPONDENT_COOKIE_NAME,
      showReact ? 'react' : 'angular',
      RESPONDENT_COOKIE_OPTIONS,
    )
  }

  if (showReact) {
    serveReact(req, res, next)
  } else {
    serveAngular(req, res, next)
  }
})

ReactMigrationRouter.get('*', (req, res, next) => {
  // only admin who chose react should see react, everybody else is plain angular
  if (req.cookies?.[ADMIN_COOKIE_NAME] === 'react') {
    serveReact(req, res, next)
  } else {
    serveAngular(req, res, next)
  }
})
