import { useCallback, useMemo } from 'react'
import { Icon, Skeleton } from '@chakra-ui/react'

import { BxsInfoCircle } from '~assets/icons'
import Toggle from '~components/Toggle'
import Tooltip from '~components/Tooltip'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

export const FormNricMaskToggle = (): JSX.Element => {
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const isNricMaskEnabled = useMemo(
    () => settings?.isNricMaskEnabled,
    [settings],
  )

  const { mutateNricMask } = useMutateFormSettings()

  const handleToggleNricMask = useCallback(() => {
    if (!settings || isLoadingSettings || mutateNricMask.isLoading) return
    const nextIsNricMaskEnabled = !settings.isNricMaskEnabled
    return mutateNricMask.mutate(nextIsNricMaskEnabled)
  }, [isLoadingSettings, mutateNricMask, settings])

  return (
    <Skeleton isLoaded={true}>
      <Toggle
        isLoading={false}
        isChecked={isNricMaskEnabled}
        label="Enable NRIC masking"
        labelComponentRight={
          <Tooltip
            placement="top"
            label="Enabling this will apply NRIC masking to the entire form and all collected data"
          >
            <Icon as={BxsInfoCircle} marginLeft="0.5rem" />
          </Tooltip>
        }
        description="NRIC numbers are masked by default; only the last 4 characters will be displayed and collected (e.g. S7914578N appears as *****578N)"
        onChange={handleToggleNricMask}
      />
    </Skeleton>
  )
}
