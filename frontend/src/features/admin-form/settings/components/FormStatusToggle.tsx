import { useCallback, useMemo } from 'react'
import { Flex, Skeleton, Stack, Text, useDisclosure } from '@chakra-ui/react'

import {
  FormAuthType,
  FormResponseMode,
  FormStatus,
} from '~shared/types/form/form'

import InlineMessage from '~components/InlineMessage'
import { Switch } from '~components/Toggle/Switch'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

import { SecretKeyActivationModal } from './SecretKeyActivationModal'

export const FormStatusToggle = (): JSX.Element => {
  const { data: formSettings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const { status, responseMode, authType, esrvcId } = formSettings ?? {}

  const storageModalProps = useDisclosure()
  const { onOpen: onOpenActivationModal } = storageModalProps

  const isFormPublic = useMemo(() => status === FormStatus.Public, [status])
  const isPreventActivation = useMemo(
    () =>
      // Prevent switch from being activated if form has authType but no esrvcId.
      // But only if form is not already public
      // (so admin can toggle to private mode when that happens somehow).
      status === FormStatus.Private &&
      authType &&
      [FormAuthType.CP, FormAuthType.SP, FormAuthType.MyInfo].includes(
        authType,
      ) &&
      !esrvcId,
    [authType, esrvcId, status],
  )

  const { mutateFormStatus } = useMutateFormSettings()

  const handleToggleStatus = useCallback(() => {
    if (!status || isLoadingSettings || mutateFormStatus.isLoading) return

    const nextStatus =
      status === FormStatus.Public ? FormStatus.Private : FormStatus.Public

    if (
      nextStatus === FormStatus.Public &&
      responseMode === FormResponseMode.Encrypt
    ) {
      return onOpenActivationModal()
    }

    return mutateFormStatus.mutate(nextStatus)
  }, [
    isLoadingSettings,
    mutateFormStatus,
    onOpenActivationModal,
    responseMode,
    status,
  ])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!status}>
      <Stack>
        {formSettings?.responseMode === FormResponseMode.Encrypt && (
          <SecretKeyActivationModal
            {...storageModalProps}
            publicKey={formSettings.publicKey}
          />
        )}
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
            isDisabled={isPreventActivation}
            aria-label="Toggle form status"
            aria-describedby="form-status"
            isLoading={mutateFormStatus.isLoading}
            isChecked={isFormPublic}
            onChange={handleToggleStatus}
          />
        </Flex>
        {isPreventActivation ? (
          <InlineMessage variant="warning">
            This form cannot be activated until a valid e-service ID is entered
            in the Singpass section
          </InlineMessage>
        ) : null}
      </Stack>
    </Skeleton>
  )
}
