import { ReactNode, useRef, useState } from 'react'
import { useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
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

/** Enable a provider before opening a new field draft. Addition never assigns it. */
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
    if (!enabled || formUsesLogin(form, required, enabled)) {
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
  const enable = async () => {
    if (
      !form ||
      !formId ||
      !provider ||
      isSaving ||
      incompatible.length ||
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
      const latest = await getAdminFormView(formId)
      if (fieldAdditionSnapshot(latest) !== pendingSnapshot.current) {
        queryClient.setQueryData(adminFormKeys.id(formId), latest)
        throw new Error(
          'The form changed while this dialog was open. Cancel and add the field again.',
        )
      }
      const auth = {
        auth_type: provider,
        ...(provider === FormAuthType.CP ? { esrvc_id: esrvcId.trim() } : {}),
      }
      if (hasWorkflow && step) {
        await updateWorkflowStep(
          formId,
          Number(stepIndex),
          Number(stepIndex) === 0
            ? { ...step, first_step_login: auth }
            : { ...step, auth },
        )
      } else {
        await updateFormLogin(formId, provider, esrvcId)
        loginSaved = true
      }
      await Promise.all([
        queryClient.invalidateQueries(adminFormKeys.id(formId)),
        queryClient.invalidateQueries(adminFormSettingsKeys.id(formId)),
      ])
      const add = pending.current
      pending.current = undefined
      setProvider(undefined)
      add?.()
    } catch (cause) {
      if (loginSaved) {
        await queryClient.invalidateQueries(adminFormKeys.id(formId))
        await queryClient.invalidateQueries(adminFormSettingsKeys.id(formId))
      }
      setError(
        cause instanceof Error
          ? `${loginSaved ? 'Authentication was enabled, but field creation could not continue. ' : ''}${cause.message}`
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
        <ModalContent>
          <ModalCloseButton isDisabled={isSaving} />
          <ModalHeader>Enable {label} to use this field</ModalHeader>
          <ModalBody>
            <Stack spacing="1rem">
              <Text>
                This field needs {label} authentication.
                {hasWorkflow
                  ? ' Adding it leaves it unassigned to a workflow step.'
                  : ''}
              </Text>
              {hasWorkflow ? (
                <>
                  <Text as="label" htmlFor="field-login-step">
                    Enable authentication on
                  </Text>
                  <Select
                    id="field-login-step"
                    value={stepIndex}
                    onChange={(event) => setStepIndex(event.target.value)}
                    isDisabled={isSaving}
                  >
                    {(isLaterStepLoginAvailable(form, enabled)
                      ? workflow
                      : workflow.slice(0, 1)
                    ).map((item, index) => (
                      <option key={item._id} value={index}>
                        Step {index + 1}
                        {item.step_name ? `: ${item.step_name}` : ''}
                      </option>
                    ))}
                  </Select>
                </>
              ) : (
                <Text>
                  Your form will use {label} instead of its current login type.
                </Text>
              )}
              {provider === FormAuthType.CP && (
                <>
                  <Text as="label" htmlFor="field-login-service">
                    Corppass e-service ID
                  </Text>
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
                </>
              )}
              {form?.status === FormStatus.Public && (
                <Text color="danger.500" role="alert">
                  Close the form before changing authentication.
                </Text>
              )}
              {incompatible.length > 0 && (
                <Text color="danger.500" role="alert">
                  Changing login would affect these fields:{' '}
                  {incompatible.map((field) => field.title).join(', ')}.{' '}
                  {hasWorkflow
                    ? 'Unassign them in Workflow first.'
                    : 'Remove them from the form first.'}
                </Text>
              )}
              {error && (
                <Text color="danger.500" role="alert">
                  {error}
                </Text>
              )}
            </Stack>
          </ModalBody>
          <ModalFooter gap="1rem">
            <Button variant="clear" onClick={close} isDisabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={enable}
              isLoading={isSaving}
              isDisabled={
                incompatible.length > 0 ||
                (provider === FormAuthType.CP &&
                  hasEsrvcIdWhitespace(esrvcId)) ||
                form?.status === FormStatus.Public
              }
            >
              Enable {label} and add field
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </FieldLoginContext.Provider>
  )
}
