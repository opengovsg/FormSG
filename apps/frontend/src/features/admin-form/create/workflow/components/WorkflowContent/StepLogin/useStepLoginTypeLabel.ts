import { useTranslation } from 'react-i18next'

import { FormAuthType } from 'formsg-shared/types'

const STEP_LOGIN_TYPE_KEYS = {
  [FormAuthType.NIL]: 'nil',
  [FormAuthType.MyInfo]: 'myInfo',
  [FormAuthType.CP]: 'cp',
  [FormAuthType.SP]: 'sp',
  [FormAuthType.SGID]: 'sgid',
  [FormAuthType.SGID_MyInfo]: 'sgidMyInfo',
} as const satisfies Record<FormAuthType, string>

/** "No login", "Singpass", "Corppass", or a retired step 1 provider's name. */
export const useStepLoginTypeLabel = () => {
  const { t } = useTranslation()
  return (authType: FormAuthType): string =>
    t(
      `features.adminForm.sidebar.workflow.stepLogin.types.${STEP_LOGIN_TYPE_KEYS[authType]}`,
    )
}
