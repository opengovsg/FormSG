export const ROOT_PAGE = `${process.env.APP_URL}`

export const LOGIN_PAGE = `${ROOT_PAGE}/login`

export const DASHBOARD_PAGE = `${ROOT_PAGE}/dashboard`

export const ADMIN_FORM_PAGE_PREFIX = `${ROOT_PAGE}/admin/form`
export const ADMIN_FORM_PAGE_CREATE = (formId: string) =>
  `${ADMIN_FORM_PAGE_PREFIX}/${formId}`
export const ADMIN_FORM_PAGE_SETTINGS = (formId: string) =>
  `${ADMIN_FORM_PAGE_CREATE(formId)}/settings`
export const ADMIN_FORM_PAGE_RESPONSES = (formId: string) =>
  `${ADMIN_FORM_PAGE_CREATE(formId)}/results`
export const ADMIN_FORM_PAGE_RESPONSES_INDIVIDUAL = (
  formId: string,
  responseId: string,
) => `${ADMIN_FORM_PAGE_CREATE(formId)}/results/${responseId}`

const PUBLIC_FORM_PAGE_PREFIX = ROOT_PAGE
export const PUBLIC_FORM_PAGE = (formId: string) =>
  `${PUBLIC_FORM_PAGE_PREFIX}/${formId}`
