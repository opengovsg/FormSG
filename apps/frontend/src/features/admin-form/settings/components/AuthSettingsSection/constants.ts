import { FormAuthType } from 'formsg-shared/types/form'

export const LOGIN_OPTION_COPY: Record<
  FormAuthType,
  {
    labelKey: 'noLogin' | 'singpass' | 'corppass'
    descriptionKey?:
      | 'legacySingpassDescription'
      | 'singpassDescription'
      | 'corppassDescription'
  }
> = {
  [FormAuthType.NIL]: { labelKey: 'noLogin' },
  [FormAuthType.SP]: {
    labelKey: 'singpass',
    descriptionKey: 'legacySingpassDescription',
  },
  [FormAuthType.MyInfo]: {
    labelKey: 'singpass',
    descriptionKey: 'singpassDescription',
  },
  [FormAuthType.CP]: {
    labelKey: 'corppass',
    descriptionKey: 'corppassDescription',
  },
}

// Keep the saved legacy login available while the admin edits a draft.
export const getLoginOptions = (savedAuthType: FormAuthType) => [
  FormAuthType.NIL,
  savedAuthType === FormAuthType.SP ? FormAuthType.SP : FormAuthType.MyInfo,
  FormAuthType.CP,
]
