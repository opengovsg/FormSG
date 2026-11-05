import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import { FormResponseMode, FormStatus } from 'formsg-shared/types'

import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { ModalCloseButton } from '~components/Modal'

import {
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useAdminFormOnOpen } from '../../hooks/useAdminFormOnOpen'
import { useUsesStepLoginRules } from '../../hooks/useUsesStepLoginRules'
import { useWorkflowMutations } from '../../mutations'
import {
  getAffectedAuthFieldRules,
  getRemovedStepAuthFields,
} from '../../utils/authFieldRemoval'
import { AffectedAuthFieldRules } from '../AffectedAuthFieldRules'
import { DeletedAuthFields } from '../DeletedAuthFields'

const COPY_KEY =
  'features.adminForm.sidebar.workflow.conditionalRouting.modals.deleteStep'

interface DeleteStepModalProps {
  onClose: () => void
  isOpen: boolean
  stepNumber: number
}

export const DeleteStepModal = ({
  onClose,
  isOpen,
  stepNumber,
}: DeleteStepModalProps): JSX.Element => {
  const { t } = useTranslation()
  const form = useAdminFormOnOpen(isOpen)
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const { deleteStepMutation } = useWorkflowMutations()
  // Without step logins, deleting a step never removes login fields.
  const usesStepLoginRules = useUsesStepLoginRules()
  const workflowForm =
    usesStepLoginRules &&
    form?.responseMode === FormResponseMode.Multirespondent
      ? form
      : undefined
  const deletedFields = workflowForm
    ? getRemovedStepAuthFields(workflowForm, stepNumber)
    : []
  const affectedRules = workflowForm
    ? getAffectedAuthFieldRules(
        workflowForm,
        deletedFields.map((field) => field._id),
      )
    : []
  const loginError =
    deletedFields.length && form?.status === FormStatus.Public
      ? t(`${COPY_KEY}.closeFormFirst`)
      : undefined
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  // Chakra's focus lock takes the first tabbable element when it is not told
  // otherwise, and that is the close button, since it is ModalContent's first
  // child regardless of sitting in the top right corner.
  //
  // Focus goes to the dialog rather than to any of the buttons. Our Button and
  // CloseButton themes paint `_focus` rather than `_focusVisible`, so a
  // programmatically focused button shows its ring even though the admin
  // opened the modal by clicking, and a ring sitting on an action on open reads
  // as though something has already been chosen. The dialog carries no focus
  // style, so nothing lights up, focus is still inside the lock, and screen
  // readers announce the title and the consequences from role and
  // aria-describedby.
  const dialogRef = useRef<HTMLDivElement>(null)

  const handleDelete = () => {
    if (!usesStepLoginRules) {
      // Cannot be put in onSuccess since this component will be unmounted by then.
      // No big deal even if we set to inactive here.
      setToInactive()
      return deleteStepMutation.mutate({ stepNumber }, { onSuccess: onClose })
    }
    // Stay open on failure so the admin can read why and review again.
    return deleteStepMutation.mutate(
      {
        stepNumber,
        confirmation: {
          expected_last_modified: form?.lastModified,
          delete_auth_field_ids: deletedFields.map((field) => field._id),
        },
      },
      {
        onSuccess: () => {
          setToInactive()
          onClose()
        },
      },
    )
  }

  const { title, description, confirm, cancel } = t(COPY_KEY, {
    returnObjects: true,
  })
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      closeOnOverlayClick={!deleteStepMutation.isLoading}
      initialFocusRef={dialogRef}
    >
      <ModalOverlay />
      <ModalContent ref={dialogRef}>
        <ModalCloseButton isDisabled={deleteStepMutation.isLoading} />
        <ModalHeader color="secondary.700">{title}</ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Stack spacing="1rem">
            <Text textStyle="body-2" color="secondary.500">
              {description}
            </Text>
            {deletedFields.length ? (
              <>
                <Text>{t(`${COPY_KEY}.deletedFieldsIntro`)}</Text>
                <DeletedAuthFields
                  fields={deletedFields}
                  formFields={form?.form_fields ?? []}
                />
                <AffectedAuthFieldRules rules={affectedRules} />
                <Text>
                  {t(
                    'features.adminForm.sidebar.workflow.stepLogin.historicalResponsesKept',
                  )}
                </Text>
              </>
            ) : null}
            {usesStepLoginRules && deleteStepMutation.isError ? (
              <InlineMessage variant="error">
                {deleteStepMutation.error instanceof Error
                  ? deleteStepMutation.error.message
                  : t(`${COPY_KEY}.failed`)}
              </InlineMessage>
            ) : null}
            {loginError ? (
              <InlineMessage variant="error">{loginError}</InlineMessage>
            ) : null}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Stack
            direction={{ base: 'column-reverse', md: 'row' }}
            w="100%"
            justify="flex-end"
          >
            <Button
              variant="clear"
              isDisabled={deleteStepMutation.isLoading}
              colorScheme="secondary"
              onClick={onClose}
            >
              {cancel}
            </Button>
            <Button
              colorScheme="danger"
              onClick={handleDelete}
              isLoading={deleteStepMutation.isLoading}
              isDisabled={!!loginError}
            >
              {confirm}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
