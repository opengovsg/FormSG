// TODO: Update landing route to correct route.
export const LANDING_ROUTE = '/'
export const ROOT_ROUTE = '/'
export const LOGIN_ROUTE = '/login'

const PUBLIC_FORM_PARAM = 'formId'
/** Used for typing useParams in PublicFormPage. */
export type PublicFormParam = { [PUBLIC_FORM_PARAM]: string }
export const PUBLIC_FORM_REGEX =
  `/:${PUBLIC_FORM_PARAM}([a-fA-F0-9]{24})` as const
