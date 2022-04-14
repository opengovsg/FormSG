import path from 'path'

import { FormAuthType } from '../../../../shared/types'
import config from '../../config/config'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'
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
  maxAge: 31 * 2 * 24 * 60 * 60, // 2 months
  sameSite: 'strict' as const,
  secure: !config.isDev,
}

const serveFormReact: ControllerHandler = (_req, res) => {
  const reactFrontendPath = path.resolve('dist/frontend')
  return res.sendFile(path.join(reactFrontendPath, 'index.html'))
}

const serveFormAngular: ControllerHandler<
  RedirectParams,
  unknown,
  unknown,
  Record<string, string>
> = (req, res, next) => {
  return PublicFormController.handleRedirect(req, res, next)
}

export const serveForm: ControllerHandler<
  RedirectParams,
  unknown,
  unknown,
  Record<string, string>
> = async (req, res, next) => {
  const formResult = await FormService.retrieveFormKeysById(req.params.formId, [
    'authType',
  ])
  let showReact: boolean | undefined = undefined
  let hasAuth = true

  if (!formResult.isErr()) {
    // This conditional router is not the one to do error handling
    // If there's any error, hasAuth will retain its value of true, and
    // the handling route will handle the error later in the usual fashion
    hasAuth = formResult.value.authType !== FormAuthType.NIL
  }

  const threshold = hasAuth
    ? config.reactMigrationConfig.respondentRolloutAuth
    : config.reactMigrationConfig.respondentRolloutNoAuth

  if (threshold <= 0) {
    // Check the rollout value first, if it's 0, react is DISABLED
    // And we ignore cookies entirely!
    showReact = false
  } else if (req.cookies) {
    if (ADMIN_COOKIE_NAME in req.cookies) {
      // Admins are dogfooders, the choice they made for the admin environment
      // also applies to the forms they need to fill themselves
      showReact = req.cookies[ADMIN_COOKIE_NAME] === 'react'
    } else if (RESPONDENT_COOKIE_NAME in req.cookies) {
      // Note: the respondent cookie is for the whole session, not for a specific form.
      // That means that within a session, a respondent will see the same environment
      // for all the forms he/she fills.
      showReact = req.cookies[RESPONDENT_COOKIE_NAME] === 'react'
    }
  }

  if (showReact === undefined) {
    const rand = Math.random() * 100
    showReact = rand <= threshold

    res.cookie(
      RESPONDENT_COOKIE_NAME,
      showReact ? 'react' : 'angular',
      RESPONDENT_COOKIE_OPTIONS,
    )
  }

  if (showReact) {
    return serveFormReact(req, res, next)
  } else {
    return serveFormAngular(req, res, next)
  }
}

export const serveDefault: ControllerHandler = (req, res, next) => {
  // only admin who chose react should see react, everybody else is plain angular
  if (req.cookies?.[ADMIN_COOKIE_NAME] === 'react') {
    // react
    return serveFormReact(req, res, next)
  } else {
    // angular
    return HomeController.home(req, res, next)
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
  return res.json({ ui })
}
