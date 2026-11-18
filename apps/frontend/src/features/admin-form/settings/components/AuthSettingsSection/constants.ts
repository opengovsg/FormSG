import { FormAuthType } from 'formsg-shared/types/form'

import { STEP_LOGIN_LABEL_KEYS } from '~features/admin-form/create/workflow/utils/stepLoginAvailability'

const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin'

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

export const LOGIN_PROVIDERS = [FormAuthType.MyInfo, FormAuthType.CP]

export const getLoginOptionsKeepingLegacySingpass = (
  savedAuthType: FormAuthType,
) => [
  FormAuthType.NIL,
  savedAuthType === FormAuthType.SP ? FormAuthType.SP : FormAuthType.MyInfo,
  FormAuthType.CP,
]
