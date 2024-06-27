import { useCallback } from 'react'

import { FormSettings } from '~shared/types/form'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'

interface FormNricMaskToggleProps {
  settings: FormSettings
  isDisabled: boolean
}

export const FormNricMaskToggle = ({
  settings,
  isDisabled,
}: FormNricMaskToggleProps): JSX.Element => {
  const isNricMaskEnabled = !!settings?.isNricMaskEnabled

  const { mutateNricMask } = useMutateFormSettings()

  const handleToggleNricMask = useCallback(() => {
    if (!settings || mutateNricMask.isLoading) return
    const nextIsNricMaskEnabled = !settings.isNricMaskEnabled
    return mutateNricMask.mutate(nextIsNricMaskEnabled)
  }, [mutateNricMask, settings])

  return (
    <Toggle
      containerStyles={{ opacity: isDisabled ? 0.3 : 1 }}
      isDisabled={isDisabled}
      isLoading={!settings || mutateNricMask.isLoading}
      isChecked={isNricMaskEnabled}
      label="Enable NRIC/FIN masking"
      description="Only the last 4 characters will be displayed on your form and collected in the CSV (e.g. S7914578N appears as *****578N)"
      onChange={handleToggleNricMask}
    />
  )
}
