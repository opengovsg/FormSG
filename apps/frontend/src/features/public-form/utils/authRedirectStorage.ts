import { MONGODB_ID_REGEX } from '~constants/routes'

const EXPECTED_AUTH_FORM_ID_KEY = 'formsg.expectedAuthFormId'

export const getExpectedAuthFormId = (): string | null => {
  try {
    const formId = window.sessionStorage.getItem(EXPECTED_AUTH_FORM_ID_KEY)

    if (formId && MONGODB_ID_REGEX.test(formId)) return formId

    window.sessionStorage.removeItem(EXPECTED_AUTH_FORM_ID_KEY)
    return null
  } catch {
    return null
  }
}

export const setExpectedAuthFormId = (formId: string): void => {
  try {
    window.sessionStorage.setItem(EXPECTED_AUTH_FORM_ID_KEY, formId)
  } catch {
    // Continue without the tab-scoped guard when storage is unavailable.
  }
}

export const clearExpectedAuthFormId = (): void => {
  try {
    window.sessionStorage.removeItem(EXPECTED_AUTH_FORM_ID_KEY)
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
