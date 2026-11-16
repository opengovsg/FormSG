import { FormAuthType } from 'formsg-shared/types/form'

import { STEP_LOGIN_LABEL_KEYS } from '~features/admin-form/create/workflow/utils/stepLoginAvailability'

const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin'

/** i18n keys for each login's name, and its radio description if any. */
export const LOGIN_OPTION_COPY = {
  [FormAuthType.NIL]: {
    labelKey: `${COPY_KEY}.noLogin`,
    descriptionKey: undefined,
  },
  [FormAuthType.SP]: {
    labelKey: STEP_LOGIN_LABEL_KEYS[FormAuthType.MyInfo],
    descriptionKey: `${COPY_KEY}.legacySingpassDescription`,
  },
  [FormAuthType.MyInfo]: {
    labelKey: STEP_LOGIN_LABEL_KEYS[FormAuthType.MyInfo],
    descriptionKey: `${COPY_KEY}.singpassDescription`,
  },
  [FormAuthType.CP]: {
    labelKey: STEP_LOGIN_LABEL_KEYS[FormAuthType.CP],
    descriptionKey: `${COPY_KEY}.corppassDescription`,
  },
} as const satisfies Record<
  FormAuthType,
  { labelKey: string; descriptionKey?: string }
>

// Keep the saved legacy login available while the admin edits a draft.
export const getLoginOptions = (savedAuthType: FormAuthType) => [
  FormAuthType.NIL,
  savedAuthType === FormAuthType.SP ? FormAuthType.SP : FormAuthType.MyInfo,
  FormAuthType.CP,
]
