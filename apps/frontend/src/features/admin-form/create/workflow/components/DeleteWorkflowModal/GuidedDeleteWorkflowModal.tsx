import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
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

import { ADMINFORM_ROUTE, ADMINFORM_SETTINGS_SUBROUTE } from '~constants/routes'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { ModalCloseButton } from '~components/Modal'
import { ProgressIndicator } from '~components/ProgressIndicator/ProgressIndicator'
import Radio from '~components/Radio'

import {
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useAdminFormOnOpen } from '../../hooks/useAdminFormOnOpen'
import { useWorkflowMutations } from '../../mutations'
import {
  getAffectedAuthFieldRules,
  getRetainedAuthDeletedFields,
  getWorkflowAuthOptions,
} from '../../utils/authFieldRemoval'
import { STEP_LOGIN_LABEL_KEYS } from '../../utils/stepLoginAvailability'
import { AffectedAuthFieldRules } from '../AffectedAuthFieldRules'
import { DeletedAuthFields } from '../DeletedAuthFields'

const COPY_KEY =
  'features.adminForm.sidebar.workflow.conditionalRouting.modals.guidedDeleteWorkflow'

interface GuidedDeleteWorkflowModalProps {
  isOpen: boolean
  onClose: () => void
  entryPoint: 'workflow-card' | 'first-step'
}

/** Resolve authentication before collapsing all respondents into one form. */
export const GuidedDeleteWorkflowModal = ({
  isOpen,
  onClose,
  entryPoint,
}: GuidedDeleteWorkflowModalProps): JSX.Element => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { formId } = useParams()
  const baselineForm = useAdminFormOnOpen(isOpen)
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
  const deletedFields = form
    ? getRetainedAuthDeletedFields(form, retainedProvider)
    : []
  const rules = form
    ? getAffectedAuthFieldRules(
        form,
        deletedFields.map((field) => field._id),
      )
    : []
  const resetRestrictions =
    form && (retainedProvider ?? FormAuthType.NIL) !== form.authType
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
        ...(retainedProvider ? { retained_auth_type: retainedProvider } : {}),
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
          {showPicker ? t(`${COPY_KEY}.pickerTitle`) : copy.title}
        </ModalHeader>
        <ModalBody>
          <Stack spacing="1rem">
            {!isFormOpen && needsPicker ? (
              <ProgressIndicator numIndicators={2} currActiveIdx={panel} />
            ) : null}
            {showPicker ? (
              <>
                <Text>{t(`${COPY_KEY}.pickerDescription`)}</Text>
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
                        {t(STEP_LOGIN_LABEL_KEYS[provider])}
                      </Radio>
                    ))}
                  </Radio.RadioGroup>
                ) : (
                  <Text>{t(`${COPY_KEY}.keepCorppass`)}</Text>
                )}
                {retainedProvider === FormAuthType.CP &&
                cpOptions.length > 1 ? (
                  <Box>
                    <Text mb="0.75rem">{t(`${COPY_KEY}.chooseEsrvcId`)}</Text>
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
                          {option.esrvcId || t(`${COPY_KEY}.noEsrvcId`)}
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
                  <Text>{t(`${COPY_KEY}.deletesWorkflow`)}</Text>
                ) : null}
                <Text>
                  {retainedProvider
                    ? t(`${COPY_KEY}.keepProvider`, {
                        provider: t(STEP_LOGIN_LABEL_KEYS[retainedProvider]),
                      })
                    : t(`${COPY_KEY}.keepNone`)}
                </Text>
                {deletedFields.length ? (
                  <>
                    <Text textStyle="subhead-1">
                      {t(`${COPY_KEY}.deletedFieldsIntro`)}
                    </Text>
                    <DeletedAuthFields
                      fields={deletedFields}
                      formFields={form?.form_fields ?? []}
                    />
                  </>
                ) : (
                  <Text>{t(`${COPY_KEY}.keepAllFields`)}</Text>
                )}
                <AffectedAuthFieldRules rules={rules} />
                {resetRestrictions ? (
                  <Text>{t(`${COPY_KEY}.resetRestrictions`)}</Text>
                ) : null}
                <Text>
                  {t(
                    'features.adminForm.sidebar.workflow.stepLogin.historicalResponsesKept',
                  )}
                </Text>
              </>
            )}
            {deleteWorkflowMutation.isError ? (
              <InlineMessage variant="error">
                {deleteWorkflowMutation.error instanceof Error
                  ? deleteWorkflowMutation.error.message
                  : t(`${COPY_KEY}.failed`)}
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
              {!showPicker && needsPicker && !isFormOpen
                ? t('features.common.back')
                : copy.cancel}
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
                {t('features.common.next')}
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
