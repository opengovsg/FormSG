import { useCallback, useMemo } from 'react'
import { Flex, Skeleton, Text } from '@chakra-ui/react'

import { FormStatus } from '~shared/types/form/form'

import { Switch } from '~components/Toggle/Switch'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

export const FormStatusToggle = (): JSX.Element => {
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const isFormPublic = useMemo(
    () => settings?.status === FormStatus.Public,
    [settings?.status],
  )

  const { mutateFormStatus } = useMutateFormSettings()

  const handleToggleStatus = useCallback(() => {
    if (!settings?.status || isLoadingSettings || mutateFormStatus.isLoading)
      return
    const nextStatus =
      settings.status === FormStatus.Public
        ? FormStatus.Private
        : FormStatus.Public
    return mutateFormStatus.mutate(nextStatus)
  }, [isLoadingSettings, mutateFormStatus, settings?.status])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Flex
        bg={isFormPublic ? 'success.100' : 'danger.200'}
        py="1rem"
        px="1.125rem"
        justify="space-between"
      >
        <Text textStyle="subhead-1" id="form-status">
          Your form is <b>{isFormPublic ? 'OPEN' : 'CLOSED'}</b> to new
          responses
        </Text>
        <Switch
          aria-describedby="form-status"
          isLoading={mutateFormStatus.isLoading}
          isChecked={isFormPublic}
          onChange={handleToggleStatus}
        />
      </Flex>
    </Skeleton>
  )
}
