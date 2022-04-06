import { Router } from 'express'
import {
  NextFunction,
  ParamsDictionary,
  Request,
  Response,
} from 'express-serve-static-core'
import path from 'path'
import { ParsedQs } from 'qs'

import config from '../../config/config'
import { ControllerHandler } from '../core/core.types'
import * as PublicFormController from '../form/public-form/public-form.controller'
import { RedirectParams } from '../form/public-form/public-form.types'
import * as HomeController from '../home/home.controller'

export const ReactMigrationRouter = Router()

const RESPONDENT_COOKIE_NAME = 'v2-respondent-ui'
const ADMIN_COOKIE_NAME = 'v2-admin-ui'

const REACT_ROLLOUT_THRESHOLD = 20 / 100

export const RESPONDENT_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: !config.isDev,
}

function serveReact(_req: Request, res: Response) {
  console.log('serveReact')
  const reactFrontendPath = path.resolve('dist/frontend')
  res.sendFile(path.join(reactFrontendPath, 'index.html'))
}

const serveAngular: ControllerHandler<
  RedirectParams,
  unknown,
  unknown,
  Record<string, string>
> = (req, res) => {
  PublicFormController.handleRedirect(req, res)
}

ReactMigrationRouter.get('/:formId([a-fA-F0-9]{24})', (req, res) => {
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
    serveReact(req, res)
  } else {
    serveAngular(req, res)
  }
})

ReactMigrationRouter.get('*', (req, res) => {
  // only admin who chose react should see react, everybody else is plain angular
  if (req.cookies?.[ADMIN_COOKIE_NAME] === 'react') {
    serveReact(req, res)
  } else {
    serveAngular(req, res)
  }
})
