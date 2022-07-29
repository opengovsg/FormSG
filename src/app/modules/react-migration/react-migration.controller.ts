// TODO #4279: Remove after React rollout is complete
import path from 'path'

import { FormAuthType, UiCookieValues } from '../../../../shared/types'
import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'
import * as PublicFormController from '../form/public-form/public-form.controller'
import { RedirectParams } from '../form/public-form/public-form.types'
import * as HomeController from '../home/home.controller'

export type SetEnvironmentParams = {
  ui: UiCookieValues
}

export const RESPONDENT_COOKIE_OPTIONS = {
  httpOnly: false,
  sameSite: 'strict' as const,
  secure: !config.isDev,
}

export const RESPONDENT_COOKIE_OPTIONS_WITH_EXPIRY = {
  ...RESPONDENT_COOKIE_OPTIONS,
  maxAge: 31 * 2 * 24 * 60 * 60, // 2 months
}

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: false,
  sameSite: 'strict' as const,
  secure: !config.isDev,
}

export const ADMIN_COOKIE_OPTIONS_WITH_EXPIRY = {
  ...ADMIN_COOKIE_OPTIONS,
  maxAge: 31 * 2 * 24 * 60 * 60, // 2 months
}

const logger = createLoggerWithLabel(module)

const serveFormReact: ControllerHandler = (_req, res) => {
  const reactFrontendPath = path.resolve('dist/frontend')
  logger.info({
    message: 'serveFormReact',
    meta: {
      action: 'routeReact.serveFormReact',
      __dirname,
      cwd: process.cwd(),
      reactFrontendPath,
    },
  })
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

  const respThreshold = hasAuth
    ? config.reactMigration.respondentRolloutAuth
    : config.reactMigration.respondentRolloutNoAuth

  if (config.reactMigration.qaCookieName in req.cookies) {
    showReact =
      req.cookies[config.reactMigration.qaCookieName] === UiCookieValues.React
  } else if (respThreshold <= 0) {
    // Check the rollout value first, if it's 0, react is DISABLED
    // And we ignore cookies entirely!
    showReact = false
  } else if (req.cookies) {
    if (config.reactMigration.adminCookieName in req.cookies) {
      // Admins are dogfooders, the choice they made for the admin environment
      // also applies to the forms they need to fill themselves
      showReact =
        req.cookies[config.reactMigration.adminCookieName] ===
        UiCookieValues.React
    } else if (config.reactMigration.respondentCookieName in req.cookies) {
      // Note: the respondent cookie is for the whole session, not for a specific form.
      // That means that within a session, a respondent will see the same environment
      // for all the forms he/she fills.
      showReact =
        req.cookies[config.reactMigration.respondentCookieName] ===
        UiCookieValues.React
    }
  }

  if (showReact === undefined) {
    const rand = Math.random() * 100
    showReact = rand <= respThreshold

    logger.info({
      message: 'Randomly assigned UI environment for respondent',
      meta: {
        action: 'routeReact.random',
        hasAuth,
        rand,
        respThreshold,
        showReact,
      },
    })

    res.cookie(
      config.reactMigration.respondentCookieName,
      showReact ? UiCookieValues.React : UiCookieValues.Angular,
      RESPONDENT_COOKIE_OPTIONS,
    )
  }

  logger.info({
    message: 'Routing evaluation done for respondent',
    meta: {
      action: 'routeReact',
      hasAuth,
      respThreshold,
      showReact,
      cwd: process.cwd(),
    },
  })

  if (showReact) {
    return serveFormReact(req, res, next)
  } else {
    return serveFormAngular(req, res, next)
  }
}

export const serveDefault: ControllerHandler = (req, res, next) => {
  // only admin who chose react should see react, everybody else is plain angular
  let showReact: boolean | undefined = undefined

  const adminThreshold = config.reactMigration.adminRollout

  if (config.reactMigration.qaCookieName in req.cookies) {
    showReact =
      req.cookies[config.reactMigration.qaCookieName] === UiCookieValues.React
  } else if (adminThreshold <= 0) {
    // Check the rollout value first, if it's 0, react is DISABLED
    // And we ignore cookies entirely!
    showReact = false
  } else {
    showReact =
      req.cookies[config.reactMigration.adminCookieName] ===
      UiCookieValues.React
  }

  if (showReact === undefined) {
    const rand = Math.random() * 100
    showReact = rand <= adminThreshold

    logger.info({
      message: 'Randomly assigned UI environment for admin',
      meta: {
        action: 'routeReact.random',
        rand,
        adminThreshold,
        showReact,
      },
    })

    res.cookie(
      config.reactMigration.adminCookieName,
      showReact ? UiCookieValues.React : UiCookieValues.Angular,
      // If assigned react, admins will stay on it unless they opt out.
      // If assigned angular, the admin cookie is for a single session
      showReact ? ADMIN_COOKIE_OPTIONS_WITH_EXPIRY : ADMIN_COOKIE_OPTIONS,
    )
  }

  logger.info({
    message: 'Routing evaluation done for admin',
    meta: {
      action: 'routeReact',
      adminThreshold,
      showReact,
      cwd: process.cwd(),
    },
  })

  if (showReact) {
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
  const ui =
    req.params.ui === UiCookieValues.React
      ? UiCookieValues.React
      : UiCookieValues.Angular
  res.cookie(
    config.reactMigration.adminCookieName,
    ui,
    // When admin chooses to switch environments, we want them to stay on their
    // chosen environment until the alternative is stable.
    ADMIN_COOKIE_OPTIONS_WITH_EXPIRY,
  )
  return res.json({ ui })
}

// Note: frontend is expected to refresh after executing this
export const publicChooseEnvironment: ControllerHandler<
  SetEnvironmentParams,
  unknown,
  unknown,
  Record<string, string>
> = (req, res) => {
  const ui =
    req.params.ui === UiCookieValues.React
      ? UiCookieValues.React
      : UiCookieValues.Angular
  res.cookie(
    config.reactMigration.respondentCookieName,
    ui,
    // When public responded chooses to switch environments, we want them to stay on
    // their chosen environment until the alternative is stable.
    RESPONDENT_COOKIE_OPTIONS_WITH_EXPIRY,
  )
  return res.json({ ui })
}
