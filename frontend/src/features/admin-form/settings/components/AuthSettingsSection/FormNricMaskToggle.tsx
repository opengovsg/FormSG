import { useCallback, useMemo } from 'react'

import { FormSettings } from '~shared/types/form'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'

interface FormNricMaskToggleProps {
  settings: FormSettings
}

export const FormNricMaskToggle = ({
  settings,
}: FormNricMaskToggleProps): JSX.Element => {
  const isNricMaskEnabled = useMemo(
    () => settings?.isNricMaskEnabled,
    [settings],
  )

  const { mutateNricMask } = useMutateFormSettings()

  const handleToggleNricMask = useCallback(() => {
    if (!settings || mutateNricMask.isLoading) return
    const nextIsNricMaskEnabled = !settings.isNricMaskEnabled
    return mutateNricMask.mutate(nextIsNricMaskEnabled)
  }, [mutateNricMask, settings])

  return (
    <Toggle
      isLoading={!settings || mutateNricMask.isLoading}
      isChecked={isNricMaskEnabled}
      label="Enable NRIC masking"
      description="NRIC numbers are masked by default; only the last 4 characters will be displayed and collected (e.g. S7914578N appears as *****578N)"
      onChange={handleToggleNricMask}
    />
  )
}
