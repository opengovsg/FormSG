import path from 'path'

import config from '../../config/config'
import { ControllerHandler } from '../core/core.types'
import * as PublicFormController from '../form/public-form/public-form.controller'
import { RedirectParams } from '../form/public-form/public-form.types'
import * as HomeController from '../home/home.controller'

const RESPONDENT_COOKIE_NAME = 'v2-respondent-ui'
const ADMIN_COOKIE_NAME = 'v2-admin-ui'

export type SetEnvironmentParams = {
  ui: 'react' | 'angular'
}

export const RESPONDENT_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: !config.isDev,
}

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 365 * 24 * 60 * 60, // 1 year
  sameSite: 'strict' as const,
  secure: !config.isDev,
}

const serveFormReact: ControllerHandler = (_req, res) => {
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
  let showReact: boolean | undefined = undefined

  if (config.reactMigrationConfig.respondentRollout <= 0) {
    // Check the rollout value first, if it's 0, react is DISABLED
    // And we ignore cookies entirely!
    showReact = false
  } else if (req.cookies) {
    if (ADMIN_COOKIE_NAME in req.cookies) {
      showReact = req.cookies[ADMIN_COOKIE_NAME] === 'react'
    } else if (RESPONDENT_COOKIE_NAME in req.cookies) {
      showReact = req.cookies[RESPONDENT_COOKIE_NAME] === 'react'
    }
  }

  if (showReact === undefined) {
    const rand = Math.random() * 100
    showReact = rand <= config.reactMigrationConfig.respondentRollout

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
    serveFormReact(req, res, next)
  } else {
    // angular
    HomeController.home(req, res, next)
  }
}

// Note: frontend is expected to refresh after executing this
export const adminChooseEnvironment: ControllerHandler<
  SetEnvironmentParams,
  unknown,
  unknown,
  Record<string, string>
> = (req, res) => {
  const ui = req.params.ui === 'react' ? 'react' : 'angular'
  res.cookie(ADMIN_COOKIE_NAME, ui, ADMIN_COOKIE_OPTIONS)
  res.json({ ui })
}
