// TODO: Update landing route to correct route.
export const LANDING_ROUTE = '/'
export const ROOT_ROUTE = '/'
export const LOGIN_ROUTE = '/login'

const PUBLIC_FORM_PARAM = 'formId'
/** Used for typing useParams in PublicFormPage. */
export type PublicFormParam = { [PUBLIC_FORM_PARAM]: string }
export const PUBLIC_FORM_REGEX =
  `/:${PUBLIC_FORM_PARAM}([a-fA-F0-9]{24})` as const

export const ADMINFORM_ROUTE = '/admin/form'
/** Build tab has no subroute, its the index admin form route. */
export const ADMINFORM_BUILD_SUBROUTE = ''
export const ADMINFORM_SETTINGS_SUBROUTE = 'settings'
export const ADMINFORM_RESPONSES_SUBROUTE = 'responses'
