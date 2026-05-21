import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { BasicField } from 'formsg-shared/types'
import {
  EmailFormDto,
  FormResponseMode,
  FormStatus,
} from 'formsg-shared/types/form/form'

import InlineMessage from '~components/InlineMessage'
import { Switch } from '~components/Toggle/Switch'

import { useAdminForm } from '~features/admin-form/common/queries'
import {
  completedPhases,
  stepsSelector,
  useWorkflowBuilderStore,
} from '~features/admin-form/create/workflow-v2/workflowBuilderStore'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

import { EmailModeConvertModal } from './EmailModeConvertModal'
import { SecretKeyActivationModal } from './SecretKeyActivationModal'
import { isEsrvcidRequired } from './utils'

export const FormStatusToggle = (): JSX.Element => {
  const { t } = useTranslation()
  const { formId } = useParams()
  const navigate = useNavigate()
  const {
    data: { form_fields, _id: adminFormId, ...adminFormData } = {},
    isLoading: isLoadingForm,
  } = useAdminForm()
  const { data: formSettings, isLoading: isLoadingFormSettings } =
    useAdminFormSettings()

  const { status, responseMode, authType, esrvcId } = formSettings ?? {}

  const secretKeyActivationModalProps = useDisclosure()
  const { onOpen: onOpenActivationModal } = secretKeyActivationModalProps

  // Workflow incomplete modal
  const workflowModalProps = useDisclosure()
  const steps = useWorkflowBuilderStore(stepsSelector)
  const workflowStoreState = useWorkflowBuilderStore((s) => s)
  const hasWorkflow = steps.length > 1
  const workflowComplete = useMemo(() => {
    if (!hasWorkflow) return true
    const done = completedPhases(workflowStoreState)
    return done.length === 4
  }, [hasWorkflow, workflowStoreState])

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
  }, [authType, esrvcId, formSettings?.responseMode, form_fields, status, t])

  const { mutateFormStatus } = useMutateFormSettings()

  const handleToggleStatus = useCallback(() => {
    if (!status || isLoadingFormSettings || mutateFormStatus.isLoading) return

    const nextStatus =
      status === FormStatus.Public ? FormStatus.Private : FormStatus.Public

    // Intercept: workflow exists but not complete
    if (nextStatus === FormStatus.Public && hasWorkflow && !workflowComplete) {
      return workflowModalProps.onOpen()
    }

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
    hasWorkflow,
    workflowComplete,
    workflowModalProps,
  ])

  const statusText = t(
    `features.adminForm.settings.general.status.description.${isFormPublic ? 'open' : 'closed'}`,
  )

  const isForceConvertFromEmailToStorage =
    responseMode === FormResponseMode.Email &&
    (adminFormData as EmailFormDto).isForceConvertToStorageMode
  const emailModeConvertModalProps = useDisclosure()
  const { onOpen: onOpenEmailModeConvertModal } = emailModeConvertModalProps

  const onFormToggleStatusClick = useCallback(() => {
    if (!isFormPublic && isForceConvertFromEmailToStorage) {
      return onOpenEmailModeConvertModal()
    }
    return handleToggleStatus()
  }, [
    handleToggleStatus,
    isForceConvertFromEmailToStorage,
    isFormPublic,
    onOpenEmailModeConvertModal,
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
          <Box>
            <Text textStyle="subhead-1" id="form-status">
              {t(
                'features.adminForm.settings.general.status.description.prefix',
              )}
              <b>{statusText}</b>
              {t(
                'features.adminForm.settings.general.status.description.suffix',
              )}
            </Text>
            {!isFormPublic && hasWorkflow && !workflowComplete && (
              <Text textStyle="body-2" color="secondary.400" mt="0.25rem">
                Finish setting up all workflow steps to open this form.
              </Text>
            )}
          </Box>
          <Switch
            isDisabled={!!preventActivationMessage}
            aria-label={t(
              'features.adminForm.settings.general.status.ariaLabel',
            )}
            aria-describedby="form-status"
            isLoading={mutateFormStatus.isLoading}
            isChecked={isFormPublic}
            onChange={onFormToggleStatusClick}
          />
        </Flex>
        {preventActivationMessage ? (
          <InlineMessage variant="warning">
            {preventActivationMessage}
          </InlineMessage>
        ) : null}

        {/* Workflow incomplete modal */}
        <Modal
          isOpen={workflowModalProps.isOpen}
          onClose={workflowModalProps.onClose}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Finish setting up your workflow</ModalHeader>
            <ModalCloseButton />
            <ModalBody color="secondary.500">
              Assign all remaining steps before opening this form.
            </ModalBody>
            <ModalFooter>
              <Button
                variant="clear"
                mr={3}
                onClick={workflowModalProps.onClose}
              >
                Cancel
              </Button>
              <Button
                colorScheme="primary"
                onClick={() => {
                  workflowModalProps.onClose()
                  if (formId) {
                    navigate(`/admin/form/${formId}`)
                  }
                }}
              >
                Go to Workflows
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Stack>
    </Skeleton>
  )
}
