// TODO #4279: Remove after React rollout is complete
import { readFileSync } from 'fs'
import { escape } from 'html-escaper'
import { get } from 'lodash'
import path from 'path'

import {
  FormResponseMode,
  FormStatus,
  UiCookieValues,
} from '../../../../shared/types'
import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'
import * as PublicFormController from '../form/public-form/public-form.controller'
import { createMetatags } from '../form/public-form/public-form.service'
import { RedirectParams } from '../form/public-form/public-form.types'
import * as HomeController from '../home/home.controller'

export type SetEnvironmentParams = {
  ui: UiCookieValues
}

export const RESPONDENT_COOKIE_OPTIONS = {
  httpOnly: false,
  sameSite: 'lax' as const, // Setting to 'strict' resets the cookie after redirecting from myInfo
  secure: !config.isDev,
}

export const RESPONDENT_COOKIE_OPTIONS_WITH_EXPIRY = {
  ...RESPONDENT_COOKIE_OPTIONS,
  maxAge: 31 * 12 * 24 * 60 * 60, // 12 months
}

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: false,
  sameSite: 'lax' as const,
  secure: !config.isDev,
}

export const ADMIN_COOKIE_OPTIONS_WITH_EXPIRY = {
  ...ADMIN_COOKIE_OPTIONS,
  maxAge: 31 * 12 * 24 * 60 * 60, // 12 months
}

const logger = createLoggerWithLabel(module)

const reactFrontendPath = path.resolve('dist/frontend')
const reactHtml = readFileSync(path.join(reactFrontendPath, 'index.html'), {
  encoding: 'utf8',
})

type MetaTags = {
  title: string
  description: string
  image: string
}
const replaceWithMetaTags = ({
  title,
  description,
  image,
}: MetaTags): string => {
  return reactHtml
    .replace(/(__OG_TITLE__)/g, escape(title))
    .replace(/(__OG_DESCRIPTION__)/g, escape(description))
    .replace(/(__OG_IMAGE__)/g, escape(image))
}

const serveFormReact =
  (isPublicForm: boolean): ControllerHandler =>
  async (req, res) => {
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

    let tags: MetaTags = {
      title: 'FormSG',
      description: 'Trusted form manager of the Singapore Government',
      image: 'og-img-metatag-nonpublicform.png',
    }

    if (isPublicForm && get(req.params, 'formId')) {
      tags = await getPublicFormMetaTags(get(req.params, 'formId') ?? '')
    }

    const reactHtmlWithMetaTags = replaceWithMetaTags(tags)

    return (
      res
        // Prevent index.html from being cached by browsers.
        .setHeader('Cache-Control', 'no-cache')
        .send(reactHtmlWithMetaTags)
    )
  }

const serveFormAngular: ControllerHandler<
  RedirectParams,
  unknown,
  unknown,
  Record<string, string>
> = (req, res, next) => {
  return PublicFormController.handleRedirect(req, res, next)
}

const getPublicFormMetaTags = async (formId: string): Promise<MetaTags> => {
  const createMetatagsResult = await createMetatags({
    formId,
  })

  if (createMetatagsResult.isErr()) {
    logger.error({
      message: 'Error fetching metatags',
      meta: {
        action: 'getPublicFormMetaTags',
        formId,
      },
      error: createMetatagsResult.error,
    })
    return {
      title: 'FormSG',
      description: '',
      image: 'og-img-metatag-publicform.png',
    }
  } else {
    const { title, description } = createMetatagsResult.value
    return {
      title: title,
      description: description ?? '',
      image: 'og-img-metatag-publicform.png',
    }
  }
}

export const servePublicForm: ControllerHandler<
  RedirectParams,
  unknown,
  unknown,
  Record<string, string>
> = async (req, res, next) => {
  const formResult = await FormService.retrieveFormKeysById(req.params.formId, [
    'responseMode',
  ])
  let showReact: boolean | undefined = undefined
  let isEmail = false

  if (!formResult.isErr()) {
    // This conditional router is not the one to do error handling
    // If there's any error, isEmail will retain its value of false, and
    // the handling route will handle the error later in the usual fashion
    isEmail = formResult.value.responseMode === FormResponseMode.Email
  }

  const respThreshold = isEmail
    ? config.reactMigration.respondentRolloutEmail
    : config.reactMigration.respondentRolloutStorage

  if (config.reactMigration.qaCookieName in req.cookies) {
    showReact =
      req.cookies[config.reactMigration.qaCookieName] === UiCookieValues.React
  } else if (respThreshold <= 0) {
    // Check the rollout value first, if it's 0, react is DISABLED
    // And we ignore cookies entirely!
    showReact = false
    // Delete existing cookies to prevent infinite redirection
    if (req.cookies) {
      res.clearCookie(config.reactMigration.respondentCookieName)
    }
  } else if (config.reactMigration.respondentCookieName in req.cookies) {
    // Note: the respondent cookie is for the whole session, not for a specific form.
    // That means that within a session, a respondent will see the same environment
    // for all the forms he/she fills.
    showReact =
      req.cookies[config.reactMigration.respondentCookieName] ===
      UiCookieValues.React
  }

  if (showReact === undefined) {
    const rand = Math.random() * 100
    showReact = rand <= respThreshold

    logger.info({
      message: 'Randomly assigned UI environment for respondent',
      meta: {
        action: 'routeReact.random',
        isEmail,
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
      isEmail,
      respThreshold,
      showReact,
      cwd: process.cwd(),
    },
  })

  if (showReact) {
    return serveFormReact(
      !formResult.isErr() && formResult.value.status === FormStatus.Public,
    )(req, res, next)
  } else {
    return serveFormAngular(req, res, next)
  }
}

export const serveDefault: ControllerHandler = (req, res, next) => {
  // Delete the deprecated cookie.
  if (req.cookies[config.reactMigration.adminCookieNameOld]) {
    res.clearCookie(config.reactMigration.adminCookieNameOld)
  }

  // Admins assigned react, or who choose react will stay on react until they opt out
  // Admins assigned angular will stay on it for that session
  let showReact: boolean | undefined = undefined

  const adminThreshold = config.reactMigration.adminRollout

  if (config.reactMigration.qaCookieName in req.cookies) {
    showReact =
      req.cookies[config.reactMigration.qaCookieName] === UiCookieValues.React
  } else if (adminThreshold <= 0) {
    // Check the rollout value first, if it's 0, react is DISABLED
    // And we ignore cookies entirely!
    showReact = false
    // Delete existing cookie to prevent infinite redirection
    if (req.cookies) {
      res.clearCookie(config.reactMigration.adminCookieName)
    }
  } else if (req.cookies) {
    if (config.reactMigration.adminCookieName in req.cookies) {
      // Check if admin had already chosen react previously
      showReact =
        req.cookies[config.reactMigration.adminCookieName] ===
        UiCookieValues.React
    }
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
    return serveFormReact(/* isPublic= */ false)(req, res, next)
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

// Redirect to landing after setting the admin cookie
export const redirectAdminEnvironment: ControllerHandler<
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
  return res.redirect('/')
}
