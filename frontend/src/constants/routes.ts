export const LANDING_ROUTE = '/'
export const LANDING_PAYMENTS_ROUTE = '/payments'
export const DASHBOARD_ROUTE = '/dashboard'
export const LOGIN_ROUTE = '/login'
export const TEMP_LOGIN_ROUTE = '/login-temp'
export const LOGIN_CALLBACK_ROUTE = '/login/select-profile'

export const TOU_ROUTE = '/terms'
export const PRIVACY_POLICY_ROUTE = '/privacy'

export const BILLING_ROUTE = '/billing'

// Cannot use regex match in react-router@6, which means we need to validate
// the regex in PublicFormPage.
export const PUBLICFORM_ROUTE = '/:formId'
export const USE_TEMPLATE_REDIRECT_SUBROUTE = 'use-template'
export const MONGODB_ID_REGEX = /^([a-fA-F0-9]{24})$/

export const ADMINFORM_ROUTE = '/admin/form'
/** Build tab has no subroute, its the index admin form route. */
export const ADMINFORM_BUILD_SUBROUTE = ''
export const ADMINFORM_SETTINGS_SUBROUTE = 'settings'
export const ADMINFORM_RESULTS_SUBROUTE = 'results'
export const ADMINFORM_PREVIEW_ROUTE = 'preview'
export const ADMINFORM_USETEMPLATE_ROUTE = 'use-template'

// sub sub routes within settings
export const ADMINFORM_SETTINGS_SINGPASS_SUBROUTE = `${ADMINFORM_SETTINGS_SUBROUTE}/singpass`
export const ADMINFORM_SETTINGS_PAYMENTS_SUBROUTE = `${ADMINFORM_SETTINGS_SUBROUTE}/payments`

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
export const RESULTS_CHARTS_SUBROUTE = 'charts'

export const ACTIVE_ADMINFORM_RESULTS_ROUTE_REGEX = new RegExp(
  `${ADMINFORM_ROUTE}/([a-fA-F0-9]{24})/${ADMINFORM_RESULTS_SUBROUTE}(/${RESULTS_FEEDBACK_SUBROUTE}|/${RESULTS_CHARTS_SUBROUTE})?/?`,
  'i',
)

export const PAYMENT_PAGE_SUBROUTE = 'payment/:paymentId'
export const EDIT_SUBMISSION_PAGE_SUBROUTE = 'edit/:submissionId'

// Path for growthbook api proxy, set up on cloudflare workers. Worker script: https://github.com/opengovsg/formsg-private/pull/171.
export const GROWTHBOOK_API_HOST_PATH = '/api/v1/proxy/growthbook'
