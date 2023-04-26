import { readFileSync } from 'fs'
import { escape } from 'html-escaper'
import { get } from 'lodash'
import path from 'path'

import { FormStatus } from '../../../../shared/types'
import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'
import { createMetatags } from '../form/public-form/public-form.service'
import { RedirectParams } from '../form/public-form/public-form.types'

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
    'status',
  ])

  const isPublicForm =
    !formResult.isErr() && formResult.value.status === FormStatus.Public

  return serveFormReact(isPublicForm)(req, res, next)
}

export const serveDefault: ControllerHandler = (req, res, next) => {
  return serveFormReact(/* isPublic= */ false)(req, res, next)
}
