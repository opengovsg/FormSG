import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@chakra-ui/react'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'
import { isPaymentCapableFormSettings } from '../../utils'

export const GstToggleSection = (): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.payments.gstToggle',
  })
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const hasGST = useMemo(
    () =>
      settings &&
      isPaymentCapableFormSettings(settings) &&
      settings?.payments_field.gst_enabled,
    [settings],
  )

  const { mutateGST } = useMutateFormSettings()

  const handleToggleGST = useCallback(() => {
    if (
      !settings ||
      isLoadingSettings ||
      mutateGST.isLoading ||
      !isPaymentCapableFormSettings(settings)
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
        label={t('label')}
        description={t('description')}
        onChange={() => handleToggleGST()}
      />
    </Skeleton>
  )
}
