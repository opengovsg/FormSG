import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormControl, FormErrorMessage, Stack } from '@chakra-ui/react'

import { SingleSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import Textarea from '~components/Textarea'

import { getStepRecipients, WorkflowHistory } from './getStopNotifiedEmails'
import { WORKFLOW_ACTIONS_I18N } from './i18n'
import { WorkflowActionModal } from './WorkflowActionModal'

const I18N_PREFIX = `${WORKFLOW_ACTIONS_I18N}.sendBackModal` as const

/** Matches the server's limit on send back remarks. */
export const MAX_SEND_BACK_REMARKS_LENGTH = 1000

export interface SendBackModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (params: { targetStepNumber: number; remarks: string }) => void
  isLoading?: boolean
  history: WorkflowHistory
}

export const SendBackModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  history,
}: SendBackModalProps): JSX.Element => {
  const { t } = useTranslation()
  const { submittedSteps, workflow, workflowEvents } = history
  const pendingStepNumber = submittedSteps.length + 1
  const defaultStep = String(pendingStepNumber - 1)
  const [step, setStep] = useState(defaultStep)
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setStep(defaultStep)
    setRemarks('')
  }, [isOpen, defaultStep])

  // Steps 2 to the one before the pending step. Step 1 is never a target, as
  // no step stores who its respondent is.
  const stepItems = Array.from(
    { length: Math.max(pendingStepNumber - 2, 0) },
    (_, index) => {
      const stepNumber = index + 2
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
  const notifiedEmails = isValidStep
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
      notifiedEmails={notifiedEmails}
      confirmLabel={t(`${I18N_PREFIX}.confirm`)}
      isConfirmDisabled={!isValidStep || !!remarksError}
      isConfirmLoading={isLoading}
      onConfirm={() => onConfirm({ targetStepNumber, remarks: remarks.trim() })}
    >
      <Stack spacing="1.5rem">
        <FormControl isRequired>
          <FormLabel>{t(`${I18N_PREFIX}.stepLabel`)}</FormLabel>
          <SingleSelect
            name="sendBackStep"
            value={step}
            onChange={setStep}
            items={stepItems}
            isClearable={false}
          />
        </FormControl>
        <FormControl isInvalid={!!remarksError}>
          <FormLabel description={t(`${I18N_PREFIX}.remarksDescription`)}>
            {t(`${I18N_PREFIX}.remarksLabel`)}
          </FormLabel>
          <Textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
          <FormErrorMessage>{remarksError}</FormErrorMessage>
        </FormControl>
      </Stack>
    </WorkflowActionModal>
  )
}
