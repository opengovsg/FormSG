import { useCallback } from 'react'

import { FormAuthType, FormSettings } from '~shared/types'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'

interface FormSingpassAuthToggleProps {
  settings: FormSettings
  isDisabled: boolean
}

const DEFAULT_FORM_AUTH_TYPE = FormAuthType.SGID

export const FormSingpassAuthToggle = ({
  settings,
  isDisabled,
}: FormSingpassAuthToggleProps): JSX.Element => {
  const isSingpassAuthEnabled =
    settings && settings?.authType !== FormAuthType.NIL

  const { mutateFormAuthType } = useMutateFormSettings()

  const handleToggleSingpassAuth = useCallback(() => {
    if (!settings || mutateFormAuthType.isLoading) return
    const nextAuthType =
      settings.authType === FormAuthType.NIL
        ? DEFAULT_FORM_AUTH_TYPE
        : FormAuthType.NIL
    return mutateFormAuthType.mutate(nextAuthType)
  }, [mutateFormAuthType, settings])

  return (
    <Toggle
      containerStyles={{ mb: '1rem', opacity: isDisabled ? 0.3 : 1 }}
      isDisabled={isDisabled}
      isLoading={!settings || mutateFormAuthType.isLoading}
      isChecked={isSingpassAuthEnabled}
      label="Enable Singpass authentication"
      description="Respondents must log in with Singpass before filling in your form"
      onChange={handleToggleSingpassAuth}
    />
  )
}
