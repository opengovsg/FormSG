const ADMIN_FORM_BACKEND_ERROR_KEY_PREFIX =
  'features.adminForm.backendErrors' as const

export const adminFormErrorKey = (suffix: string) =>
  `${ADMIN_FORM_BACKEND_ERROR_KEY_PREFIX}.${suffix}`
