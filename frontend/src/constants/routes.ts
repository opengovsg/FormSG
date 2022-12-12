export const LANDING_ROUTE = '/'
export const DASHBOARD_ROUTE = '/dashboard'
export const LOGIN_ROUTE = '/login'

export const TOU_ROUTE = '/terms'
export const PRIVACY_POLICY_ROUTE = '/privacy'

export const BILLING_ROUTE = '/billing'

// Cannot use regex match in react-router@6, which means we need to validate
// the regex in PublicFormPage.
export const PUBLICFORM_ROUTE = '/:formId'
export const USE_TEMPLATE_REDIRECT_SUBROUTE = 'use-template'
export const FORMID_REGEX = /^([a-fA-F0-9]{24})$/

export const ADMINFORM_ROUTE = '/admin/form'
/** Build tab has no subroute, its the index admin form route. */
export const ADMINFORM_BUILD_SUBROUTE = ''
export const ADMINFORM_SETTINGS_SUBROUTE = 'settings'
export const ADMINFORM_RESULTS_SUBROUTE = 'results'
export const ADMINFORM_PREVIEW_ROUTE = 'preview'
export const ADMINFORM_USETEMPLATE_ROUTE = 'use-template'

/**
 * Regex for active path matching on adminform builder routes/subroutes.
 * @example Breakdown of regex:
 * `${ADMINFORM_ROUTE}/` - non-capturing start of route
 * `([a-fA-F0-9]{24})` - formId capture group, will be match[1]
 * `(/${ADMINFORM_SETTINGS_SUBROUTE}|/${ADMINFORM_RESULTS_SUBROUTE})` - subroute capture group, will be match[2]
 * `?` - optional subroute capture group
 * `/?` - optional trailing slash, also allows for ADMINFORM_BUILD_SUBROUTE to match
 */
export const ACTIVE_ADMINFORM_BUILDER_ROUTE_REGEX = new RegExp(
  `${ADMINFORM_ROUTE}/([a-fA-F0-9]{24})(/${ADMINFORM_SETTINGS_SUBROUTE}|/${ADMINFORM_RESULTS_SUBROUTE})?/?`,
  'i',
)

/** Responses tab has no subroute, its the index results route. */
export const RESULTS_RESPONSES_SUBROUTE = ''
export const RESULTS_FEEDBACK_SUBROUTE = 'feedback'

export const ACTIVE_ADMINFORM_RESULTS_ROUTE_REGEX = new RegExp(
  `${ADMINFORM_ROUTE}/([a-fA-F0-9]{24})/${ADMINFORM_RESULTS_SUBROUTE}(/${RESULTS_FEEDBACK_SUBROUTE})?/?`,
  'i',
)
