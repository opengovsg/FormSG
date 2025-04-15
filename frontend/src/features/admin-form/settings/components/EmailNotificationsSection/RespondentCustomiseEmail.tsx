import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BiPencil } from 'react-icons/bi'
import { Flex, FormLabel, Skeleton, Stack, Text } from '@chakra-ui/react'

import Button from '~components/Button'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

export const RespondentCustomiseEmail = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const hasCaptcha = useMemo(() => settings?.hasCaptcha, [settings]) //TODO: update settings from hasCaptcha to rc

  //   const { mutateFormCaptcha } = useMutateFormSettings()

  //   const handleRespondentCustomiseEmail = useCallback(() => {
  //     if (!settings || isLoadingSettings || mutateFormCaptcha.isLoading) return
  //     const nextHasCaptcha = !settings.hasCaptcha
  //     return mutateFormCaptcha.mutate(nextHasCaptcha)
  //   }, [isLoadingSettings, mutateFormCaptcha, settings])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      {/* <Toggle
        isLoading={mutateFormCaptcha.isLoading}
        isChecked={hasCaptcha}
        label={t(
          'features.adminForm.settings.emailNotifications.section.regular.info',
        )}
        onChange={() => handleToggleRespondentCopy()}
      /> */}
      <Flex justifyContent="space-between" alignItems="center" mb={2} mt="2rem">
        <FormLabel>
          {t(
            'features.adminForm.settings.emailNotifications.section.regular.customiseEmailLabel',
          )}
        </FormLabel>
        <Button
          onClick={() => {}}
          isLoading={false}
          isDisabled={false}
          variant={'outline'}
          gap="0.5rem"
        >
          <BiPencil />
          Test
        </Button>
      </Flex>
    </Skeleton>
  )
}
