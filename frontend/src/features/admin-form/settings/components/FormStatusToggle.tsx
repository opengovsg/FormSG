import { useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Flex, Skeleton, Text } from '@chakra-ui/react'

import { FormId, FormStatus } from '~shared/types/form/form'

import { Switch } from '~components/Toggle/Switch'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

export const FormStatusToggle = (): JSX.Element => {
  const { formId } = useParams<{ formId: FormId }>()
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const isFormPublic = useMemo(
    () => settings?.status === FormStatus.Public,
    [settings?.status],
  )

  const { mutate, isLoading: isLoadingMutation } = useMutateFormSettings({
    formId,
  })

  const handleToggleStatus = useCallback(() => {
    if (!settings?.status || isLoadingSettings || isLoadingMutation) return
    const nextStatus =
      settings.status === FormStatus.Public
        ? FormStatus.Private
        : FormStatus.Public
    return mutate(nextStatus)
  }, [isLoadingMutation, isLoadingSettings, mutate, settings?.status])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Flex
        bg={isFormPublic ? 'success.100' : 'danger.200'}
        py="1rem"
        px="1.125rem"
        justify="space-between"
      >
        <Text textStyle="subhead-1">
          Your form is <b>{isFormPublic ? 'OPEN' : 'CLOSED'}</b> to new
          responses
        </Text>
        <Switch
          isLoading={isLoadingMutation}
          isChecked={isFormPublic}
          onChange={handleToggleStatus}
        />
      </Flex>
    </Skeleton>
  )
}
