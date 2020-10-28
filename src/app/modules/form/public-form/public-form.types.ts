import { ParamsDictionary } from 'express-serve-static-core'

export type Metatags = {
  title: string
  description?: string
  appUrl: string
  images: string[]
  twitterImage: string
}

export type RedirectParams = ParamsDictionary & {
  state?: 'preview' | 'template' | 'use-template'
  // TODO(#144): Rename Id to formId after all routes have been updated.
  Id: string
}
