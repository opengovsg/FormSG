import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormControl, FormErrorMessage, Stack } from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import { MAX_SEND_BACK_REMARKS_LENGTH } from 'formsg-shared/constants'

import { SingleSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'

import { getStepRecipients, WorkflowHistory } from './getStopNotifiedEmails'
import { WORKFLOW_ACTIONS_I18N } from './i18n'
import { WorkflowActionModal } from './WorkflowActionModal'

const I18N_PREFIX = `${WORKFLOW_ACTIONS_I18N}.sendBackModal` as const
const KEEP_FILLED = 'keep'
const CLEAR_FIELDS = 'clear'

export interface SendBackModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (params: {
    targetStepNumber: number
    remarks?: string
    stepOneRecipientEmail?: string
    clearResponses: boolean
  }) => void
  isLoading?: boolean
  history: WorkflowHistory
  canSendBackToStepOne?: boolean
}

export const SendBackModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  history,
  canSendBackToStepOne = false,
}: SendBackModalProps): JSX.Element => {
  const { t } = useTranslation()
  const { submittedSteps, workflow, workflowEvents } = history
  const pendingStepNumber = submittedSteps.length + 1
  const defaultStep = String(pendingStepNumber - 1)
  const [step, setStep] = useState(defaultStep)
  const [remarks, setRemarks] = useState('')
  const [stepOneEmail, setStepOneEmail] = useState('')
  const [keepFilled, setKeepFilled] = useState(KEEP_FILLED)

  useEffect(() => {
    if (!isOpen) return
    setStep(defaultStep)
    setRemarks('')
    setStepOneEmail('')
    setKeepFilled(KEEP_FILLED)
  }, [isOpen, defaultStep])

  const firstTargetStep = canSendBackToStepOne ? 1 : 2
  const stepItems = Array.from(
    { length: Math.max(pendingStepNumber - firstTargetStep, 0) },
    (_, index) => {
      const stepNumber = index + firstTargetStep
      const name = workflow[stepNumber - 1]?.step_name?.trim()
      return {
        value: String(stepNumber),
        label: `${t(`${WORKFLOW_ACTIONS_I18N}.activityLog.stepNumber`, {
          stepNumber,
        })}${
          name
            ? t(`${WORKFLOW_ACTIONS_I18N}.activityLog.stepNameLabel`, { name })
            : ''
        }`,
      }
    },
  )
  const targetStepNumber = Number(step)
  const isValidStep = stepItems.some(({ value }) => value === step)
  const remarksError =
    remarks.length > MAX_SEND_BACK_REMARKS_LENGTH
      ? t(`${I18N_PREFIX}.remarksTooLong`, {
          max: MAX_SEND_BACK_REMARKS_LENGTH,
        })
      : undefined
  const isToStepOne = isValidStep && targetStepNumber === 1
  const trimmedStepOneEmail = stepOneEmail.trim().toLowerCase()
  const isStepOneEmailValid = isEmail(trimmedStepOneEmail)
  const stepOneEmailError =
    isToStepOne && stepOneEmail.trim() && !isStepOneEmailValid
      ? t(`${WORKFLOW_ACTIONS_I18N}.addAssigneeModal.invalidEmail`)
      : undefined
  const notifiedEmails = !isValidStep
    ? []
    : isToStepOne
      ? isStepOneEmailValid
        ? [trimmedStepOneEmail]
        : []
      : getStepRecipients({
          submittedSteps,
          events: workflowEvents,
          stepNumber: targetStepNumber,
        })

  return (
    <WorkflowActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t(`${I18N_PREFIX}.title`)}
      description={t(`${I18N_PREFIX}.description`)}
      isBeta
      notifiedEmails={notifiedEmails}
      confirmLabel={t(`${I18N_PREFIX}.confirm`)}
      isConfirmDisabled={
        !isValidStep || !!remarksError || (isToStepOne && !isStepOneEmailValid)
      }
      isConfirmLoading={isLoading}
      onConfirm={() =>
        onConfirm({
          targetStepNumber,
          remarks: remarks.trim() || undefined,
          clearResponses: keepFilled === CLEAR_FIELDS,
          ...(isToStepOne
            ? { stepOneRecipientEmail: trimmedStepOneEmail }
            : {}),
        })
      }
    >
      <Stack spacing="1.5rem">
        <FormControl isRequired>
          <FormLabel>{t(`${I18N_PREFIX}.stepLabel`)}</FormLabel>
          <SingleSelect
            name="sendBackStep"
            items={stepItems}
            value={step}
            isClearable={false}
            onChange={setStep}
          />
        </FormControl>
        {isToStepOne ? (
          <FormControl isRequired isInvalid={!!stepOneEmailError}>
            <FormLabel
              description={t(`${I18N_PREFIX}.stepOneEmailDescription`)}
            >
              {t(`${I18N_PREFIX}.stepOneEmailLabel`)}
            </FormLabel>
            <Input
              type="email"
              value={stepOneEmail}
              placeholder="me@example.com"
              onChange={(event) => setStepOneEmail(event.target.value)}
            />
            <FormErrorMessage>{stepOneEmailError}</FormErrorMessage>
          </FormControl>
        ) : null}
        <FormControl isInvalid={!!remarksError}>
          <FormLabel description={t(`${I18N_PREFIX}.remarksDescription`)}>
            {t(`${I18N_PREFIX}.remarksLabel`)}
          </FormLabel>
          <Textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
          />
          <FormErrorMessage>{remarksError}</FormErrorMessage>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>{t(`${I18N_PREFIX}.keepFilledLabel`)}</FormLabel>
          <SingleSelect
            name="sendBackKeepFilled"
            items={[
              { value: KEEP_FILLED, label: t(`${I18N_PREFIX}.keepFilledYes`) },
              { value: CLEAR_FIELDS, label: t(`${I18N_PREFIX}.keepFilledNo`) },
            ]}
            value={keepFilled}
            isClearable={false}
            onChange={setKeepFilled}
          />
        </FormControl>
      </Stack>
    </WorkflowActionModal>
  )
}
