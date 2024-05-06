import { useCallback, useMemo } from 'react'
import { Flex, Skeleton, Stack, Text, useDisclosure } from '@chakra-ui/react'
import { Infobox, Switch } from '@opengovsg/design-system-react'

import { BasicField } from '~shared/types'
import {
  FormAuthType,
  FormResponseMode,
  FormStatus,
} from '~shared/types/form/form'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

import { SecretKeyActivationModal } from './SecretKeyActivationModal'

export const FormStatusToggle = (): JSX.Element => {
  const { data: { form_fields } = {} } = useAdminForm()
  const { data: formSettings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const { status, responseMode, authType, esrvcId } = formSettings ?? {}

  const secretKeyActivationModalProps = useDisclosure()
  const { onOpen: onOpenActivationModal } = secretKeyActivationModalProps

  const isFormPublic = useMemo(() => status === FormStatus.Public, [status])
  const preventActivationMessage: string | undefined = useMemo(() => {
    // Only prevent switch from private -> public. If already public, never prevent toggling
    if (status === FormStatus.Public) return

    // Prevent form activation if form has authType but no esrvcId.
    if (
      authType &&
      [FormAuthType.CP, FormAuthType.SP, FormAuthType.MyInfo].includes(
        authType,
      ) &&
      !esrvcId
    ) {
      return 'This form cannot be activated until a valid e-service ID is entered in the Singpass section.'
    }

    // For MRF, prevent form activation if form has an email confirmation field.
    if (
      formSettings?.responseMode === FormResponseMode.Multirespondent &&
      form_fields?.some(
        (ff) =>
          ff.fieldType === BasicField.Email && ff.autoReplyOptions.hasAutoReply,
      )
    ) {
      return 'Email confirmation is not supported in multi-respondent forms. Please remove email confirmations from email fields before activating your form.'
    }
  }, [authType, esrvcId, formSettings?.responseMode, form_fields, status])

  const { mutateFormStatus } = useMutateFormSettings()

  const handleToggleStatus = useCallback(() => {
    if (!status || isLoadingSettings || mutateFormStatus.isLoading) return

    const nextStatus =
      status === FormStatus.Public ? FormStatus.Private : FormStatus.Public

    if (
      nextStatus === FormStatus.Public &&
      (responseMode === FormResponseMode.Encrypt ||
        responseMode === FormResponseMode.Multirespondent)
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
        {(formSettings?.responseMode === FormResponseMode.Encrypt ||
          formSettings?.responseMode === FormResponseMode.Multirespondent) && (
          <SecretKeyActivationModal
            {...secretKeyActivationModalProps}
            publicKey={formSettings.publicKey}
          />
        )}
        <Flex
          bg={
            isFormPublic
              ? 'interaction.success-subtle.default'
              : 'interaction.critical-subtle.default'
          }
          py="1rem"
          px="1.125rem"
          justify="space-between"
        >
          <Text textStyle="subhead-1" id="form-status">
            Your form is <b>{isFormPublic ? 'OPEN' : 'CLOSED'}</b> to new
            responses
          </Text>
          <Switch
            isDisabled={!!preventActivationMessage}
            aria-label="Toggle form status"
            aria-describedby="form-status"
            isLoading={mutateFormStatus.isLoading}
            isChecked={isFormPublic}
            onChange={handleToggleStatus}
          />
        </Flex>
        {preventActivationMessage ? (
          <Infobox variant="warning">{preventActivationMessage}</Infobox>
        ) : null}
      </Stack>
    </Skeleton>
  )
}
