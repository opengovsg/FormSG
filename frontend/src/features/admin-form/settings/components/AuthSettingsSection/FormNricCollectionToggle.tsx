import { useCallback } from 'react'

import { FormSettings } from '~shared/types/form'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'

interface FormSubmitterIdCollectionProps {
  settings: FormSettings
  isDisabled: boolean
}

export const FormSubmitterIdCollectionToggle = ({
  settings,
  isDisabled,
}: FormSubmitterIdCollectionProps): JSX.Element => {
  const isSubmitterIdCollectionEnabled =
    !!settings?.isSubmitterIdCollectionEnabled

  const { mutateIsSubmitterIdCollectionEnabled } = useMutateFormSettings()

  const handleToggleCollection = useCallback(() => {
    if (!settings || mutateIsSubmitterIdCollectionEnabled.isLoading) return
    const nextIsNricMaskEnabled = !settings.isSubmitterIdCollectionEnabled
    return mutateIsSubmitterIdCollectionEnabled.mutate(nextIsNricMaskEnabled)
  }, [mutateIsSubmitterIdCollectionEnabled, settings])

  return (
    <Toggle
      containerStyles={{ opacity: isDisabled ? 0.3 : 1 }}
      isDisabled={isDisabled}
      isLoading={!settings || mutateIsSubmitterIdCollectionEnabled.isLoading}
      isChecked={isSubmitterIdCollectionEnabled}
      label="Collect NRIC/FIN/UENs with form submissions"
      description="NRIC/FIN/UENs are not collected or stored with form submissions by default"
      onChange={handleToggleCollection}
    />
  )
}
