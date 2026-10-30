import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
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

import {
  FormAuthType,
  FormResponseMode,
  FormStatus,
  WorkflowStepAuthType,
} from 'formsg-shared/types'
import {
  getFieldSourceProvider,
  STEP_LOGIN_PROVIDER_LABELS,
} from 'formsg-shared/utils/step-login'

import { ADMINFORM_ROUTE, ADMINFORM_SETTINGS_SUBROUTE } from '~constants/routes'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { ModalCloseButton } from '~components/Modal'
import { ProgressIndicator } from '~components/ProgressIndicator/ProgressIndicator'
import Radio from '~components/Radio'

import { useAdminForm } from '~features/admin-form/common/queries'

import {
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useWorkflowMutations } from '../../mutations'
import {
  getAffectedAuthFieldRules,
  getWorkflowAuthOptions,
  toStepLoginAuthType,
} from '../../utils/authFieldRemoval'
import { AffectedAuthFieldRules } from '../AffectedAuthFieldRules'

interface DeleteWorkflowModalProps {
  isOpen: boolean
  onClose: () => void
  entryPoint: 'workflow-card' | 'first-step'
}

/** Resolve authentication before collapsing all respondents into one form. */
export const DeleteWorkflowModal = ({
  isOpen,
  onClose,
  entryPoint,
}: DeleteWorkflowModalProps): JSX.Element => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { formId } = useParams()
  const { data: loadedForm } = useAdminForm()
  const [baselineForm, setBaselineForm] = useState(loadedForm)
  const wasOpen = useRef(false)
  useEffect(() => {
    if (isOpen && !wasOpen.current) setBaselineForm(loadedForm)
    wasOpen.current = isOpen
  }, [isOpen, loadedForm])
  const form =
    baselineForm?.responseMode === FormResponseMode.Multirespondent
      ? baselineForm
      : undefined
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const { deleteWorkflowMutation } = useWorkflowMutations()
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  const dialogRef = useRef<HTMLDivElement>(null)
  const options = form ? getWorkflowAuthOptions(form) : []
  const providers = [...new Set(options.map((option) => option.authType))]
  const needsPicker = providers.length > 1 || options.length > 1
  const [panel, setPanel] = useState(0)
  const [selectedProvider, setSelectedProvider] =
    useState<WorkflowStepAuthType>()
  const [selectedEsrvcId, setSelectedEsrvcId] = useState<string>()
  useEffect(() => {
    if (!isOpen) return
    setPanel(0)
    setSelectedProvider(undefined)
    setSelectedEsrvcId(undefined)
  }, [isOpen])
  const retainedProvider =
    selectedProvider ?? (providers.length === 1 ? providers[0] : undefined)
  const cpOptions = options.filter(
    (option) => option.authType === FormAuthType.CP,
  )
  const retainedEsrvcId =
    selectedEsrvcId ??
    (cpOptions.length === 1 ? cpOptions[0].esrvcId : undefined)
  const selectionReady =
    (providers.length === 0 || retainedProvider !== undefined) &&
    (retainedProvider !== FormAuthType.CP || retainedEsrvcId !== undefined)
  const deletedFields =
    form?.form_fields.filter((field) => {
      const provider = getFieldSourceProvider(field)
      return provider && provider !== retainedProvider
    }) ?? []
  const rules = form
    ? getAffectedAuthFieldRules(
        form,
        deletedFields.map((field) => field._id),
      )
    : []
  const resetRestrictions =
    form &&
    (retainedProvider ?? FormAuthType.NIL) !==
      toStepLoginAuthType(form.authType)
  const isFormOpen = form?.status === FormStatus.Public
  const isLoading = deleteWorkflowMutation.isLoading
  const showPicker = !isFormOpen && needsPicker && panel === 0
  const copy = t(
    isFormOpen
      ? 'features.adminForm.sidebar.workflow.conditionalRouting.modals.closeFormFirst'
      : entryPoint === 'first-step'
        ? 'features.adminForm.sidebar.workflow.conditionalRouting.modals.deleteFirstStep'
        : 'features.adminForm.sidebar.workflow.conditionalRouting.modals.deleteWorkflow',
    { returnObjects: true },
  )
  const close = () => {
    if (!isLoading) onClose()
  }
  const handleDelete = () => {
    if (!selectionReady || isLoading) return
    deleteWorkflowMutation.mutate(
      {
        ...(retainedProvider &&
        !(form?.authType === FormAuthType.SP && providers.length === 1)
          ? { retained_auth_type: retainedProvider }
          : {}),
        ...(retainedProvider === FormAuthType.CP
          ? { retained_esrvc_id: retainedEsrvcId }
          : {}),
        expected_last_modified: form?.lastModified,
        delete_auth_field_ids: deletedFields.map((field) => field._id),
      },
      {
        onSuccess: () => {
          setToInactive()
          onClose()
        },
      },
    )
  }
  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      size={modalSize}
      closeOnOverlayClick={!isLoading}
      closeOnEsc={!isLoading}
      initialFocusRef={dialogRef}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent ref={dialogRef}>
        <ModalCloseButton isDisabled={isLoading} />
        <ModalHeader color="secondary.700">
          {showPicker ? 'Choose authentication to keep' : copy.title}
        </ModalHeader>
        <ModalBody>
          <Stack spacing="1rem">
            {!isFormOpen && needsPicker ? (
              <ProgressIndicator numIndicators={2} currActiveIdx={panel} />
            ) : null}
            {showPicker ? (
              <>
                <Text>
                  Your form will have one respondent after deleting the
                  workflow. Choose which authentication it should keep.
                </Text>
                {providers.length > 1 ? (
                  <Radio.RadioGroup
                    value={retainedProvider ?? ''}
                    onChange={(value: WorkflowStepAuthType) =>
                      setSelectedProvider(value)
                    }
                  >
                    {providers.map((provider) => (
                      <Radio
                        key={provider}
                        value={provider}
                        allowDeselect={false}
                      >
                        {STEP_LOGIN_PROVIDER_LABELS[provider]}
                      </Radio>
                    ))}
                  </Radio.RadioGroup>
                ) : (
                  <Text>Keep Corppass authentication.</Text>
                )}
                {retainedProvider === FormAuthType.CP &&
                cpOptions.length > 1 ? (
                  <Box>
                    <Text mb="0.75rem">
                      Choose the Corppass e-service ID to keep.
                    </Text>
                    <Radio.RadioGroup
                      value={
                        selectedEsrvcId === ''
                          ? '__empty-esrvc-id__'
                          : (selectedEsrvcId ?? '')
                      }
                      onChange={(value) =>
                        setSelectedEsrvcId(
                          value === '__empty-esrvc-id__' ? '' : value,
                        )
                      }
                    >
                      {cpOptions.map((option) => (
                        <Radio
                          key={option.esrvcId}
                          value={option.esrvcId || '__empty-esrvc-id__'}
                          allowDeselect={false}
                        >
                          {option.esrvcId || 'No e-service ID configured'}
                        </Radio>
                      ))}
                    </Radio.RadioGroup>
                  </Box>
                ) : null}
              </>
            ) : isFormOpen ? (
              <Text>{copy.description}</Text>
            ) : (
              <>
                {entryPoint === 'first-step' ? (
                  <Text>Deleting Step 1 deletes the entire workflow.</Text>
                ) : null}
                <Text>
                  All workflow steps, approvals and workflow routing will be
                  removed. The form will keep{' '}
                  {retainedProvider
                    ? STEP_LOGIN_PROVIDER_LABELS[retainedProvider]
                    : 'no'}{' '}
                  authentication.
                </Text>
                {deletedFields.length ? (
                  <>
                    <Text textStyle="subhead-1">
                      These fields will be deleted from your form:
                    </Text>
                    {deletedFields.map((field) => (
                      <Text key={field._id}>{field.title}</Text>
                    ))}
                  </>
                ) : (
                  <Text>All form fields will be kept.</Text>
                )}
                <AffectedAuthFieldRules rules={rules} />
                {resetRestrictions ? (
                  <Text>
                    The original Step 1 eligibility list and one-response limit
                    will be reset because its authentication provider is
                    changing.
                  </Text>
                ) : null}
                <Text>Historical responses will not be deleted.</Text>
              </>
            )}
            {deleteWorkflowMutation.isError ? (
              <InlineMessage variant="error">
                {deleteWorkflowMutation.error instanceof Error
                  ? deleteWorkflowMutation.error.message
                  : 'The workflow could not be deleted. Your changes have not been applied.'}
              </InlineMessage>
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
              colorScheme="secondary"
              isDisabled={isLoading}
              onClick={
                !showPicker && needsPicker && !isFormOpen
                  ? () => setPanel(0)
                  : close
              }
            >
              {!showPicker && needsPicker && !isFormOpen ? 'Back' : copy.cancel}
            </Button>
            {isFormOpen ? (
              <Button
                onClick={() =>
                  navigate(
                    `${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_SETTINGS_SUBROUTE}`,
                  )
                }
              >
                {copy.confirm}
              </Button>
            ) : showPicker ? (
              <Button
                onClick={() => {
                  setPanel(1)
                  dialogRef.current?.focus()
                }}
                isDisabled={!selectionReady}
              >
                Next
              </Button>
            ) : (
              <Button
                colorScheme="danger"
                onClick={handleDelete}
                isLoading={isLoading}
                isDisabled={!selectionReady}
              >
                {copy.confirm}
              </Button>
            )}
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
