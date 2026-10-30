import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Skeleton, Stack, Text, useDisclosure } from '@chakra-ui/react'

import {
  EmailFormDto,
  FormResponseMode,
  FormStatus,
} from 'formsg-shared/types/form/form'
import { hasLaterCorppassStepWithoutEsrvcId } from 'formsg-shared/utils/step-login'

import { Switch } from '~components/Toggle/Switch'

import { useAdminForm } from '~features/admin-form/common/queries'
import { AuthenticationDraftNotice } from '~features/admin-form/create/common/AuthenticationDraftNotice'
import { useAuthenticationPublishErrors } from '~features/admin-form/create/common/useAuthenticationPublishErrors'
import { useIncompleteWorkflowStepLabels } from '~features/admin-form/create/workflow/hooks/useIncompleteWorkflowStepLabels'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

import { EmailModeConvertModal } from './EmailModeConvertModal'
import { IncompleteWorkflowModal } from './IncompleteWorkflowModal'
import { SecretKeyActivationModal } from './SecretKeyActivationModal'
import { isEsrvcidRequired } from './utils'

export const FormStatusToggle = (): JSX.Element => {
  const { t } = useTranslation()
  const {
    data: adminForm,
    data: { _id: formId, ...adminFormData } = {},
    isLoading: isLoadingForm,
  } = useAdminForm()
  const { data: formSettings, isLoading: isLoadingFormSettings } =
    useAdminFormSettings()

  const { status, responseMode, authType, esrvcId } = formSettings ?? {}

  const secretKeyActivationModalProps = useDisclosure()
  const { onOpen: onOpenActivationModal } = secretKeyActivationModalProps

  const isFormPublic = useMemo(() => status === FormStatus.Public, [status])
  const preventActivationMessage: string | undefined = useMemo(() => {
    // Only prevent switch from private -> public. If already public, never prevent toggling
    if (status === FormStatus.Public) return

    // Prevent form activation if form has authType but no esrvcId.
    if (authType && isEsrvcidRequired(authType) && !esrvcId) {
      return t(
        'features.adminForm.settings.general.status.supplySingpassEServiceId',
      )
    }

    // Later Corppass steps have their own e-service ID.
    if (
      adminForm?.responseMode === FormResponseMode.Multirespondent &&
      hasLaterCorppassStepWithoutEsrvcId(adminForm.workflow)
    ) {
      return t(
        'features.adminForm.settings.general.status.supplyStepEServiceIds',
      )
    }
  }, [adminForm, authType, esrvcId, status, t])

  const { mutateFormStatus } = useMutateFormSettings()

  const handleToggleStatus = useCallback(() => {
    if (!status || isLoadingFormSettings || mutateFormStatus.isLoading) return

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
    isLoadingFormSettings,
    mutateFormStatus,
    onOpenActivationModal,
    responseMode,
    status,
  ])

  const statusText = t(
    `features.adminForm.settings.general.status.description.${isFormPublic ? 'open' : 'closed'}`,
  )

  const isForceConvertFromEmailToStorage =
    responseMode === FormResponseMode.Email &&
    (adminFormData as EmailFormDto).isForceConvertToStorageMode
  const emailModeConvertModalProps = useDisclosure()
  const { onOpen: onOpenEmailModeConvertModal } = emailModeConvertModalProps

  const incompleteWorkflowModalProps = useDisclosure()
  const { onOpen: onOpenIncompleteWorkflowModal } = incompleteWorkflowModalProps
  const incompleteStepLabels = useIncompleteWorkflowStepLabels()
  const authenticationPublishErrors = useAuthenticationPublishErrors()

  const onFormToggleStatusClick = useCallback(() => {
    if (!isFormPublic && authenticationPublishErrors.length > 0) return
    if (!isFormPublic && incompleteStepLabels.length > 0) {
      return onOpenIncompleteWorkflowModal()
    }
    if (!isFormPublic && isForceConvertFromEmailToStorage) {
      return onOpenEmailModeConvertModal()
    }
    return handleToggleStatus()
  }, [
    handleToggleStatus,
    incompleteStepLabels.length,
    authenticationPublishErrors.length,
    isForceConvertFromEmailToStorage,
    isFormPublic,
    onOpenEmailModeConvertModal,
    onOpenIncompleteWorkflowModal,
  ])

  return (
    <Skeleton isLoaded={!isLoadingFormSettings && !isLoadingForm && !!status}>
      <Stack>
        {isForceConvertFromEmailToStorage && (
          <EmailModeConvertModal
            {...emailModeConvertModalProps}
            formTitle={formSettings!.title}
            formId={formId!}
          />
        )}
        {formId ? (
          <IncompleteWorkflowModal
            {...incompleteWorkflowModalProps}
            formId={formId}
            incompleteStepLabels={incompleteStepLabels}
          />
        ) : null}
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
          align="flex-start"
        >
          <Stack spacing="0.25rem" flex="1" pr="1rem">
            <Text textStyle="subhead-1" id="form-status">
              {t(
                'features.adminForm.settings.general.status.description.prefix',
              )}
              <b>{statusText}</b>
              {t(
                'features.adminForm.settings.general.status.description.suffix',
              )}
            </Text>
            {preventActivationMessage ? (
              <Text
                textStyle="body-2"
                color="secondary.500"
                id="form-activation-requirement"
              >
                {preventActivationMessage}
              </Text>
            ) : null}
          </Stack>
          <Switch
            isDisabled={
              !!preventActivationMessage ||
              (!isFormPublic && authenticationPublishErrors.length > 0)
            }
            aria-label={t(
              'features.adminForm.settings.general.status.ariaLabel',
            )}
            aria-describedby={[
              'form-status',
              preventActivationMessage ? 'form-activation-requirement' : '',
              authenticationPublishErrors.length > 0
                ? 'authentication-publish-errors'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            isLoading={mutateFormStatus.isLoading}
            isChecked={isFormPublic}
            onChange={onFormToggleStatusClick}
          />
        </Flex>
        <AuthenticationDraftNotice />
      </Stack>
    </Skeleton>
  )
}
