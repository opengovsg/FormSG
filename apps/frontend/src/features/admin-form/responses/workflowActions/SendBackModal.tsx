import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormControl, FormErrorMessage, Stack } from '@chakra-ui/react'

import { MAX_SEND_BACK_REMARKS_LENGTH } from 'formsg-shared/constants'

import { SingleSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import Textarea from '~components/Textarea'

import { getStepRecipients, WorkflowHistory } from './getStopNotifiedEmails'
import { WORKFLOW_ACTIONS_I18N } from './i18n'
import { WorkflowActionModal } from './WorkflowActionModal'

const I18N_PREFIX = `${WORKFLOW_ACTIONS_I18N}.sendBackModal` as const

export interface SendBackModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (params: { targetStepNumber: number; remarks?: string }) => void
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
      onConfirm={() =>
        onConfirm({
          targetStepNumber,
          remarks: remarks.trim() || undefined,
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
