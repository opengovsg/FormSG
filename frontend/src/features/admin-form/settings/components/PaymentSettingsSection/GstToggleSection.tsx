import { useCallback, useMemo } from 'react'
import { Skeleton } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

export const GstToggleSection = (): JSX.Element => {
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const hasGST = useMemo(
    () =>
      settings &&
      settings.responseMode === FormResponseMode.Encrypt &&
      settings?.payments_field.gst_enabled,
    [settings],
  )

  const { mutateGST } = useMutateFormSettings()

  const handleToggleGST = useCallback(() => {
    if (
      !settings ||
      isLoadingSettings ||
      mutateGST.isLoading ||
      settings.responseMode !== FormResponseMode.Encrypt
    ) {
      return
    }
    const nextHasGst = !settings.payments_field.gst_enabled
    return mutateGST.mutate(nextHasGst)
  }, [isLoadingSettings, mutateGST, settings])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Toggle
        mb="2.5rem"
        isLoading={mutateGST.isLoading}
        isChecked={hasGST}
        label="GST applicable"
        description="GST will be mentioned in proof of payment"
        onChange={() => handleToggleGST()}
      />
    </Skeleton>
  )
}
