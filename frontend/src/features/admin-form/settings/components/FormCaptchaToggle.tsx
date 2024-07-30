import { useCallback, useMemo } from 'react'
import { Skeleton } from '@chakra-ui/react'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

export const FormCaptchaToggle = (): JSX.Element => {
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const hasCaptcha = useMemo(() => settings?.hasCaptcha, [settings])

  const { mutateFormCaptcha } = useMutateFormSettings()

  const handleToggleCaptcha = useCallback(() => {
    if (!settings || isLoadingSettings || mutateFormCaptcha.isLoading) return
    const nextHasCaptcha = !settings.hasCaptcha
    return mutateFormCaptcha.mutate(nextHasCaptcha)
  }, [isLoadingSettings, mutateFormCaptcha, settings])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Toggle
        isLoading={mutateFormCaptcha.isLoading}
        isChecked={hasCaptcha}
        label="Enable reCAPTCHA"
        description="If you expect non-English-speaking respondents, they may have difficulty understanding the reCAPTCHA selection instructions."
        onChange={() => handleToggleCaptcha()}
      />
    </Skeleton>
  )
}
