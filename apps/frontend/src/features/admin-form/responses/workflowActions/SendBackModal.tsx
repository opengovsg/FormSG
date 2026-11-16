import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  FormControl,
  FormErrorMessage,
  Stack,
  Text,
} from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import { MAX_SEND_BACK_REMARKS_LENGTH } from 'formsg-shared/constants'

import { SingleSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Radio from '~components/Radio'
import Textarea from '~components/Textarea'

import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'

import { getStepRecipients, WorkflowHistory } from './getStopNotifiedEmails'
import { WORKFLOW_ACTIONS_I18N } from './i18n'
import { WorkflowActionModal } from './WorkflowActionModal'

const KEEP_FILLED = 'keep'
const CLEAR_FIELDS = 'clear'

export type SendBackMode = 'sendBack' | 'fixStep'

export interface SendBackModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (
    params: {
      targetStepNumber: number
      remarks?: string
      stepOneRecipientEmail?: string
      clearResponses: boolean
    },
    mode: SendBackMode,
  ) => void
  isLoading?: boolean
  history: WorkflowHistory
  canSendBackToStepOne?: boolean
  modal?: 'sendBackModal' | 'fixStepModal'
}

export const SendBackModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  history,
  canSendBackToStepOne = false,
  modal = 'sendBackModal',
}: SendBackModalProps): JSX.Element => {
  const [mode, setMode] = useState<SendBackMode>(
    modal === 'fixStepModal' ? 'fixStep' : 'sendBack',
  )
  const I18N_PREFIX = `${WORKFLOW_ACTIONS_I18N}.sendBackModal` as const
  const { t } = useTranslation()
  const { submittedSteps, workflow, workflowEvents } = history
  const pendingStepNumber = submittedSteps.length + 1
  const defaultStep = String(pendingStepNumber - 1)
  const [step, setStep] = useState(defaultStep)
  const [remarks, setRemarks] = useState('')
  const [stepOneEmail, setStepOneEmail] = useState('')
  const [isStepOneEmailTouched, setIsStepOneEmailTouched] = useState(false)
  const [keepFilled, setKeepFilled] = useState(KEEP_FILLED)

  useEffect(() => {
    if (!isOpen) return
    setMode('sendBack')
    setStep(defaultStep)
    setRemarks('')
    setStepOneEmail('')
    setIsStepOneEmailTouched(false)
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
      title={t(`${WORKFLOW_ACTIONS_I18N}.sendBackModal.title`)}
      description=""
      isBeta
      confirmLabel={t(`${I18N_PREFIX}.confirm`)}
      isConfirmDisabled={
        !isValidStep || !!remarksError || (isToStepOne && !isStepOneEmailValid)
      }
      isConfirmLoading={isLoading}
      onConfirm={() =>
        onConfirm(
          {
            targetStepNumber,
            remarks: remarks.trim() || undefined,
            clearResponses: keepFilled === CLEAR_FIELDS,
            ...(isToStepOne
              ? { stepOneRecipientEmail: trimmedStepOneEmail }
              : {}),
          },
          mode,
        )
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
          {isValidStep && !isToStepOne ? (
            <Box mt="0.5rem">
              {recipients.length > 0 ? (
                <Flex flexWrap="wrap" gap="0.5rem">
                  {recipients.map((email) => (
                    <LogicBadge key={email} overflowWrap="anywhere">
                      {email}
                    </LogicBadge>
                  ))}
                </Flex>
              ) : (
                <FormLabel.Description>
                  {t(`${WORKFLOW_ACTIONS_I18N}.whoIsNotifiedNone`)}
                </FormLabel.Description>
              )}
            </Box>
          ) : null}
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
            minAutosizeRows={2}
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
          />
          <FormErrorMessage>{remarksError}</FormErrorMessage>
        </FormControl>
        <FormControl isRequired>
          <FormLabel id="send-back-route-label">
            {t(`${I18N_PREFIX}.routeLabel`)}
          </FormLabel>
          <Radio.RadioGroup
            aria-labelledby="send-back-route-label"
            name="sendBackMode"
            value={mode}
            onChange={(value: SendBackMode) => setMode(value)}
          >
            <Stack spacing="0.75rem">
              <Radio value="sendBack" allowDeselect={false}>
                <Text>
                  {t(`${I18N_PREFIX}.redoConsequence`, {
                    stepName: targetStep?.label ?? '',
                  })}
                </Text>
              </Radio>
              <Radio value="fixStep" allowDeselect={false}>
                <Text>
                  {t(`${WORKFLOW_ACTIONS_I18N}.fixStepModal.description`, {
                    currentStep: `${t(`${WORKFLOW_ACTIONS_I18N}.activityLog.stepNumber`, { stepNumber: pendingStepNumber })}${workflow[pendingStepNumber - 1]?.step_name?.trim() ? t(`${WORKFLOW_ACTIONS_I18N}.activityLog.stepNameLabel`, { name: workflow[pendingStepNumber - 1].step_name?.trim() }) : ''}`,
                  })}
                </Text>
              </Radio>
            </Stack>
          </Radio.RadioGroup>
        </FormControl>
        <FormControl isRequired>
          <FormLabel id="send-back-keep-filled-label">
            {t(`${I18N_PREFIX}.keepFilledLabel`)}
          </FormLabel>
          <Radio.RadioGroup
            aria-labelledby="send-back-keep-filled-label"
            name="sendBackKeepFilled"
            value={keepFilled}
            onChange={setKeepFilled}
          >
            <Stack spacing="0.75rem">
              <Radio value={KEEP_FILLED} allowDeselect={false}>
                <Text>{t(`${I18N_PREFIX}.keepConsequence`)}</Text>
              </Radio>
              <Radio value={CLEAR_FIELDS} allowDeselect={false}>
                <Text>
                  {t(
                    `${I18N_PREFIX}.${mode === 'sendBack' ? 'clearConsequence' : 'clearCorrectionConsequence'}`,
                    { stepName: targetStep?.label ?? '' },
                  )}
                </Text>
              </Radio>
            </Stack>
          </Radio.RadioGroup>
        </FormControl>
      </Stack>
    </WorkflowActionModal>
  )
}
