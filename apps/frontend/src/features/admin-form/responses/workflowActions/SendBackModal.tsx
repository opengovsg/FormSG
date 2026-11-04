import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  FormControl,
  FormErrorMessage,
  Stack,
} from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import { MAX_SEND_BACK_REMARKS_LENGTH } from 'formsg-shared/constants'

import { SingleSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'

import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'

import { getStepRecipients, WorkflowHistory } from './getStopNotifiedEmails'
import { WORKFLOW_ACTIONS_I18N } from './i18n'
import { WorkflowActionModal } from './WorkflowActionModal'

const I18N_PREFIX = `${WORKFLOW_ACTIONS_I18N}.sendBackModal` as const

export interface SendBackModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (params: {
    targetStepNumber: number
    remarks?: string
    stepOneRecipientEmail?: string
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
  const [isStepOneEmailTouched, setIsStepOneEmailTouched] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setStep(defaultStep)
    setRemarks('')
    setStepOneEmail('')
    setIsStepOneEmailTouched(false)
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
  const targetStep = stepItems.find(({ value }) => value === step)
  const isValidStep = !!targetStep
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
    isToStepOne &&
    isStepOneEmailTouched &&
    stepOneEmail.trim() &&
    !isStepOneEmailValid
      ? t(`${WORKFLOW_ACTIONS_I18N}.addAssigneeModal.invalidEmail`)
      : undefined
  const recipients =
    isValidStep && !isToStepOne
      ? getStepRecipients({
          submittedSteps,
          events: workflowEvents,
          stepNumber: targetStepNumber,
        })
      : []

  return (
    <WorkflowActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t(`${I18N_PREFIX}.title`)}
      description={t(`${I18N_PREFIX}.description`)}
      isBeta
      confirmLabel={t(`${I18N_PREFIX}.confirm`)}
      isConfirmDisabled={
        !isValidStep || !!remarksError || (isToStepOne && !isStepOneEmailValid)
      }
      isConfirmLoading={isLoading}
      onConfirm={() =>
        onConfirm({
          targetStepNumber,
          remarks: remarks.trim() || undefined,
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
        {isValidStep && !isToStepOne ? (
          <Box>
            <FormLabel.Label as="div">
              {t(`${I18N_PREFIX}.recipientsLabel`, {
                stepName: targetStep?.label,
              })}
            </FormLabel.Label>
            <Flex flexWrap="wrap" gap="0.5rem">
              {recipients.map((email) => (
                <LogicBadge key={email} overflowWrap="anywhere">
                  {email}
                </LogicBadge>
              ))}
            </Flex>
          </Box>
        ) : null}
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
              onBlur={() => setIsStepOneEmailTouched(true)}
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
      </Stack>
    </WorkflowActionModal>
  )
}
