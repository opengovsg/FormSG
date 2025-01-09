import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Skeleton, Stack, Text, useDisclosure } from '@chakra-ui/react'

import { BasicField } from '~shared/types'
import {
  FormAuthType,
  FormResponseMode,
  FormStatus,
} from '~shared/types/form/form'

import InlineMessage from '~components/InlineMessage'
import { Switch } from '~components/Toggle/Switch'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

import { SecretKeyActivationModal } from './SecretKeyActivationModal'

export const FormStatusToggle = (): JSX.Element => {
  const { t } = useTranslation()
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
      return t(
        'features.adminForm.settings.general.status.supplySingpassEServiceId',
      )
    }

    // For MRF, prevent form activation if form has an email confirmation field.
    if (
      formSettings?.responseMode === FormResponseMode.Multirespondent &&
      form_fields?.some(
        (ff) =>
          ff.fieldType === BasicField.Email && ff.autoReplyOptions.hasAutoReply,
      )
    ) {
      return t('features.adminForm.settings.general.status.noEmailsInMRF')
    }
  }, [authType, esrvcId, formSettings?.responseMode, form_fields, status, t])

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

  const statusText = t(
    `features.adminForm.settings.general.status.description.${isFormPublic ? 'open' : 'closed'}`,
  )

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
          bg={isFormPublic ? 'success.100' : 'danger.200'}
          py="1rem"
          px="1.125rem"
          justify="space-between"
        >
          <Text textStyle="subhead-1" id="form-status">
            {t('features.adminForm.settings.general.status.description.prefix')}
            <b>{statusText}</b>
            {t('features.adminForm.settings.general.status.description.suffix')}
          </Text>
          <Switch
            isDisabled={!!preventActivationMessage}
            aria-label={t(
              'features.adminForm.settings.general.status.ariaLabel',
            )}
            aria-describedby="form-status"
            isLoading={mutateFormStatus.isLoading}
            isChecked={isFormPublic}
            onChange={handleToggleStatus}
          />
        </Flex>
        {preventActivationMessage ? (
          <InlineMessage variant="warning">
            {preventActivationMessage}
          </InlineMessage>
        ) : null}
      </Stack>
    </Skeleton>
  )
}
