import { ReactNode, useRef, useState } from 'react'
import { useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import {
  FormControl,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react'

import {
  AdminFormDto,
  FormAuthType,
  FormResponseMode,
  FormStatus,
} from 'formsg-shared/types'
import { getStepFieldsNeedingLogin } from 'formsg-shared/utils/step-login'

import Button from '~components/Button'
import { DropdownMenuLayerProvider, SingleSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import { ModalCloseButton } from '~components/Modal'

import { getAdminFormView } from '~features/admin-form/common/AdminViewFormService'
import { adminFormKeys } from '~features/admin-form/common/queries'
import { updateWorkflowStep } from '~features/admin-form/create/workflow/FormWorkflowService'
import { useIsMrfStepLoginEnabled } from '~features/admin-form/create/workflow/hooks/useIsMrfStepLoginEnabled'
import {
  formUsesLogin,
  isLaterStepLoginAvailable,
} from '~features/admin-form/create/workflow/utils/stepLoginAvailability'
import { hasEsrvcIdWhitespace } from '~features/admin-form/settings/components/AuthSettingsSection/StepLoginControls'
import { adminFormSettingsKeys } from '~features/admin-form/settings/queries'
import { updateFormLogin } from '~features/admin-form/settings/SettingsService'

import { useCreateTabForm } from '../../useCreateTabForm'

import { FieldLoginContext, RequestField } from './FieldLoginContext'

const fieldAdditionSnapshot = (value: AdminFormDto) =>
  JSON.stringify({
    status: value.status,
    authType: value.authType,
    workflow:
      value.responseMode === FormResponseMode.Multirespondent
        ? value.workflow
        : [],
    fields: value.form_fields,
  })

type Provider = FormAuthType.MyInfo | FormAuthType.CP

/** Add a field draft now or enable its provider first. Addition never assigns it. */
export const FieldLoginGate = ({ children }: { children: ReactNode }) => {
  const { data: form } = useCreateTabForm()
  const { formId } = useParams()
  const queryClient = useQueryClient()
  const enabled = useIsMrfStepLoginEnabled()
  const [provider, setProvider] = useState<Provider>()
  const [stepIndex, setStepIndex] = useState('0')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [esrvcId, setEsrvcId] = useState('')
  const pendingSnapshot = useRef('')
  const pending = useRef<(() => void) | undefined>()
  const workflow =
    form?.responseMode === FormResponseMode.Multirespondent ? form.workflow : []
  const step = workflow[Number(stepIndex)]
  const hasWorkflow = workflow.length > 0
  const fields = hasWorkflow
    ? (form?.form_fields.filter((field) => step?.edit.includes(field._id)) ??
      [])
    : (form?.form_fields ?? [])
  const incompatible = provider
    ? getStepFieldsNeedingLogin(fields, provider)
    : []
  const label = provider === FormAuthType.CP ? 'Corppass' : 'Singpass'
  const close = () => {
    if (isSaving) return
    setProvider(undefined)
    pending.current = undefined
    setError('')
  }
  const request: RequestField = (required, add) => {
    if (!form) return
    const needsClosedDraft =
      form.status === FormStatus.Public &&
      form.responseMode === FormResponseMode.Multirespondent
    if (
      !needsClosedDraft &&
      (!enabled || formUsesLogin(form, required, enabled))
    ) {
      add()
      return
    }
    pendingSnapshot.current = fieldAdditionSnapshot(form)
    pending.current = add
    setStepIndex('0')
    setEsrvcId('')
    setError('')
    setProvider(required)
  }
  const ensureFreshDraft = async () => {
    if (!formId || !form)
      throw new Error('The form is not available. Try again.')
    const latest = await getAdminFormView(formId)
    if (latest.status === FormStatus.Public)
      throw new Error(
        'Close the form before adding an unconfigured authentication field.',
      )
    if (fieldAdditionSnapshot(latest) !== pendingSnapshot.current) {
      queryClient.setQueryData(adminFormKeys.id(formId), latest)
      throw new Error(
        'The form changed while this dialog was open. Cancel and add the field again.',
      )
    }
  }
  const openFieldDraft = () => {
    pending.current?.()
    pending.current = undefined
    setProvider(undefined)
  }
  const addWithoutEnabling = async () => {
    if (isSaving || form?.status === FormStatus.Public) return
    setIsSaving(true)
    setError('')
    try {
      await ensureFreshDraft()
      openFieldDraft()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not open the field draft.',
      )
    } finally {
      setIsSaving(false)
    }
  }
  const enable = async () => {
    if (
      !form ||
      !formId ||
      !provider ||
      isSaving ||
      (provider === FormAuthType.CP && hasEsrvcIdWhitespace(esrvcId)) ||
      form.status === FormStatus.Public
    )
      return
    setIsSaving(true)
    setError('')
    let loginSaved = false
    try {
      // Recheck the selected step before a whole-step update. Do not overwrite
      // a change made while this modal was open, or use an old insertion index.
      await ensureFreshDraft()
      const auth = {
        auth_type: provider,
        ...(provider === FormAuthType.CP ? { esrvc_id: esrvcId.trim() } : {}),
      }
      if (hasWorkflow && step) {
        const incompatibleIds = new Set(incompatible.map((field) => field._id))
        const nextStep = {
          ...step,
          edit: step.edit.filter((id) => !incompatibleIds.has(id)),
        }
        await updateWorkflowStep(
          formId,
          Number(stepIndex),
          Number(stepIndex) === 0
            ? { ...nextStep, first_step_login: auth }
            : { ...nextStep, auth },
        )
      } else {
        await updateFormLogin(formId, provider, esrvcId)
      }
      loginSaved = true
      await Promise.all([
        queryClient.invalidateQueries(adminFormKeys.id(formId)),
        queryClient.invalidateQueries(adminFormSettingsKeys.id(formId)),
      ])
      openFieldDraft()
    } catch (cause) {
      if (loginSaved) {
        await queryClient.invalidateQueries(adminFormKeys.id(formId))
        await queryClient.invalidateQueries(adminFormSettingsKeys.id(formId))
      }
      setError(
        cause instanceof Error
          ? `${loginSaved ? 'Authentication was enabled, but field creation could not continue. Cancel and add the field again. ' : ''}${cause.message}`
          : 'Could not enable authentication. Try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }
  return (
    <FieldLoginContext.Provider value={request}>
      {children}
      <Modal
        isOpen={!!provider}
        onClose={close}
        closeOnEsc={!isSaving}
        closeOnOverlayClick={!isSaving}
      >
        <ModalOverlay />
        <ModalContent maxW="48rem">
          <ModalCloseButton isDisabled={isSaving} />
          <ModalHeader>
            {form?.status === FormStatus.Public
              ? 'Close your form before adding this field'
              : `Add a ${label} field`}
          </ModalHeader>
          <ModalBody>
            <DropdownMenuLayerProvider value="popover">
              <Stack spacing="1rem">
                <Text>
                  This field needs {label} authentication before publishing. You
                  can configure it now or add the field and set up
                  authentication later.
                  {hasWorkflow
                    ? ' The field will be added without a workflow assignment.'
                    : ''}
                </Text>
                {hasWorkflow ? (
                  <FormControl
                    id="field-login-step"
                    isRequired
                    isDisabled={isSaving}
                  >
                    <FormLabel>Enable authentication on</FormLabel>
                    <SingleSelect
                      name="field-login-step"
                      value={stepIndex}
                      onChange={setStepIndex}
                      isDisabled={isSaving}
                      isClearable={false}
                      items={(isLaterStepLoginAvailable(form, enabled)
                        ? workflow
                        : workflow.slice(0, 1)
                      ).map((item, index) => ({
                        value: String(index),
                        label: `Step ${index + 1}${item.step_name ? `: ${item.step_name}` : ''}`,
                      }))}
                    />
                  </FormControl>
                ) : (
                  <Text>
                    Your form will use {label} instead of its current login
                    type.
                  </Text>
                )}
                {provider === FormAuthType.CP && (
                  <FormControl
                    id="field-login-service"
                    isRequired
                    isDisabled={isSaving}
                    isInvalid={hasEsrvcIdWhitespace(esrvcId)}
                  >
                    <FormLabel>Corppass e-service ID</FormLabel>
                    <Input
                      id="field-login-service"
                      value={esrvcId}
                      onChange={(event) => setEsrvcId(event.target.value)}
                      isDisabled={isSaving}
                    />
                    {hasEsrvcIdWhitespace(esrvcId) && (
                      <Text color="danger.500" role="alert">
                        The e-service ID must not contain spaces.
                      </Text>
                    )}
                  </FormControl>
                )}
                {form?.status === FormStatus.Public && (
                  <Text color="danger.500" role="alert">
                    Close the form before adding authentication fields.
                  </Text>
                )}
                {incompatible.length > 0 && (
                  <Text color="secondary.500">
                    {hasWorkflow
                      ? `Enabling ${label} will unassign these fields from this step: `
                      : `Switching to ${label} will leave these fields without matching authentication: `}
                    {incompatible.map((field) => field.title).join(', ')}. The
                    fields will stay in your form. Configure matching
                    authentication before publishing, or delete the unused
                    fields.
                  </Text>
                )}
                {error && (
                  <Text color="danger.500" role="alert">
                    {error}
                  </Text>
                )}
              </Stack>
            </DropdownMenuLayerProvider>
          </ModalBody>
          <ModalFooter
            gap="1rem"
            flexDirection={{
              base: 'column-reverse',
              md: incompatible.length ? 'column-reverse' : 'row',
            }}
            alignItems={{
              base: 'stretch',
              md: incompatible.length ? 'stretch' : 'center',
            }}
          >
            <Button variant="clear" onClick={close} isDisabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={addWithoutEnabling}
              isDisabled={isSaving || form?.status === FormStatus.Public}
            >
              Add without enabling yet
            </Button>
            <Button
              onClick={enable}
              whiteSpace="normal"
              minH="2.75rem"
              h="auto"
              py="0.75rem"
              isLoading={isSaving}
              isDisabled={
                (provider === FormAuthType.CP &&
                  hasEsrvcIdWhitespace(esrvcId)) ||
                form?.status === FormStatus.Public
              }
            >
              {incompatible.length
                ? `${hasWorkflow ? 'Unassign fields, enable' : 'Switch to'} ${label} and add field`
                : `Enable ${label} and add field`}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </FieldLoginContext.Provider>
  )
}
