import path from 'path'

import config from '../../config/config'
import { ControllerHandler } from '../core/core.types'
import * as PublicFormController from '../form/public-form/public-form.controller'
import { RedirectParams } from '../form/public-form/public-form.types'
// import * as HomeController from '../home/home.controller'

const RESPONDENT_COOKIE_NAME = 'v2-respondent-ui'
const ADMIN_COOKIE_NAME = 'v2-admin-ui'

const REACT_ROLLOUT_THRESHOLD = 20 / 100

export const RESPONDENT_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: !config.isDev,
}

const serveFormReact: ControllerHandler = (_req, res) => {
  console.log('serveFormReact 2')
  const reactFrontendPath = path.resolve('dist/frontend')
  res.sendFile(path.join(reactFrontendPath, 'index.html'))
}

const serveFormAngular: ControllerHandler<
  RedirectParams,
  unknown,
  unknown,
  Record<string, string>
> = (req, res, next) => {
  PublicFormController.handleRedirect(req, res, next)
}

export const serveForm: ControllerHandler<
  RedirectParams,
  unknown,
  unknown,
  Record<string, string>
> = (req, res, next) => {
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
    const rand = Math.random()
    showReact = rand < REACT_ROLLOUT_THRESHOLD

    console.log('random assignment', rand, showReact)

    res.cookie(
      RESPONDENT_COOKIE_NAME,
      showReact ? 'react' : 'angular',
      RESPONDENT_COOKIE_OPTIONS,
    )
  }

  if (showReact) {
    serveFormReact(req, res, next)
  } else {
    serveFormAngular(req, res, next)
  }
}

export const serveDefault: ControllerHandler = (req, res, next) => {
  // only admin who chose react should see react, everybody else is plain angular
  if (req.cookies?.[ADMIN_COOKIE_NAME] === 'react') {
    // react
  } else {
    // angular
  }
}
