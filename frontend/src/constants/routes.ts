// TODO: Update landing route to correct route.
export const LANDING_ROUTE = '/'
export const ROOT_ROUTE = '/'
export const LOGIN_ROUTE = '/login'

export const TOU_ROUTE = '/terms'
export const PRIVACY_ROUTE = '/privacy'

// Cannot use regex match in react-router@6, which means we need to validate
// the regex in PublicFormPage.
export const PUBLICFORM_ROUTE = '/:formId'
export const PUBLICFORM_REGEX = /^([a-fA-F0-9]{24})$/

export const ADMINFORM_ROUTE = '/admin/form'
/** Build tab has no subroute, its the index admin form route. */
export const ADMINFORM_BUILD_SUBROUTE = ''
export const ADMINFORM_SETTINGS_SUBROUTE = 'settings'
export const ADMINFORM_RESULTS_SUBROUTE = 'results'

/** Responses tab has no subroute, its the index results route. */
export const RESULTS_RESPONSES_SUBROUTE = ''
export const RESULTS_FEEDBACK_SUBROUTE = 'feedback'
