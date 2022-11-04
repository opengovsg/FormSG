export type Metatags = {
  title: string
  description?: string
  appUrl?: string
  images: string[]
  twitterImage: string
}

export type RedirectParams = {
  state?: 'preview' | 'template' | 'use-template'
  // TODO(#144): Rename Id to formId after all routes have been updated.
  formId: string
}
