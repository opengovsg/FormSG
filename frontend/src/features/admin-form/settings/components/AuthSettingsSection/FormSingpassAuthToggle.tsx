import { useCallback, useMemo } from 'react'

import { FormAuthType, FormSettings } from '~shared/types'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'

interface FormSingpassAuthToggleProps {
  settings: FormSettings
}

export const FormSingpassAuthToggle = ({
  settings,
}: FormSingpassAuthToggleProps): JSX.Element => {
  const DEFAULT_FORM_AUTH_TYPE = FormAuthType.SGID

  const isSingpassAuthEnabled = useMemo(
    () => settings && settings?.authType !== FormAuthType.NIL,
    [settings],
  )

  const { mutateFormAuthType } = useMutateFormSettings()

  const handleToggleSingpassAuth = useCallback(() => {
    if (!settings || mutateFormAuthType.isLoading) return
    const nextAuthType =
      settings.authType === FormAuthType.NIL
        ? DEFAULT_FORM_AUTH_TYPE
        : FormAuthType.NIL
    return mutateFormAuthType.mutate(nextAuthType)
  }, [mutateFormAuthType, settings, DEFAULT_FORM_AUTH_TYPE])

  return (
    <Toggle
      containerStyles={{ marginBottom: '1rem' }}
      isLoading={!settings || mutateFormAuthType.isLoading}
      isChecked={isSingpassAuthEnabled}
      label="Enable Singpass authentication"
      description="Respondents must log in with Singpass before filling in your form"
      onChange={handleToggleSingpassAuth}
    />
  )
}
