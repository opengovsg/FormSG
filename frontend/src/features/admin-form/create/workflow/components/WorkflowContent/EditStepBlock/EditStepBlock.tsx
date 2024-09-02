import { useLayoutEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Box, Stack } from '@chakra-ui/react'

import { FormWorkflowStep, WorkflowType } from '~shared/types'

import { SaveActionGroup } from '~features/admin-form/create/logic/components/LogicContent/EditLogicBlock/EditCondition'

import {
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { EditStepInputs } from '../../../types'
import { StepLabel } from '../StepLabel'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { ApprovalsBlock } from './ApprovalsBlock'
import { QuestionsBlock } from './QuestionsBlock'
import { RespondentBlock } from './RespondentBlock'

export interface EditLogicBlockProps {
  /** Sets default values of inputs if this is provided */
  defaultValues?: Partial<EditStepInputs>
  onSubmit: (inputs: FormWorkflowStep) => void

  stepNumber: number
  submitButtonLabel: string
  handleOpenDeleteModal?: () => void
  isLoading: boolean
}

export const EditStepBlock = ({
  stepNumber,
  onSubmit,
  defaultValues,
  isLoading,
  submitButtonLabel,
  handleOpenDeleteModal,
}: EditLogicBlockProps) => {
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)

  const formMethods = useForm<EditStepInputs>({
    defaultValues,
  })

  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({
        behavior: 'smooth',
        // Block required so parent (with overflow:hidden) will not be scrolled
        // and causing unscrollable white space.
        // See https://stackoverflow.com/questions/48634459/scrollintoview-block-vs-inline/48635751#48635751
        block: 'nearest',
      })
    }
  }, [])

  const handleSubmit = formMethods.handleSubmit((inputs: EditStepInputs) => {
    if (inputs.approval_field === '') {
      inputs.approval_field = undefined
    }

    if (isFirstStepByStepNumber(stepNumber)) {
      if (inputs.field) {
        return onSubmit({
          ...inputs,
          workflow_type: WorkflowType.Dynamic,
          field: inputs.field,
        })
      }
      return onSubmit({
        ...inputs,
        workflow_type: WorkflowType.Static,
        emails: inputs.emails ?? [],
      })
    }

    let step: FormWorkflowStep
    switch (inputs.workflow_type) {
      case WorkflowType.Static: {
        step = {
          ...inputs,
          // Need to explicitly set workflow_type in this object to help with typechecking.
          workflow_type: WorkflowType.Static,
          emails: inputs.emails ?? [],
        }
        break
      }
      case WorkflowType.Dynamic: {
        if (!inputs.field) return
        step = {
          ...inputs,
          workflow_type: WorkflowType.Dynamic,
          field: inputs.field,
        }
        break
      }
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _: never = inputs.workflow_type
        throw new Error('Invalid workflow type')
      }
    }
    onSubmit(step)
  })

  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  return (
    <Stack
      ref={wrapperRef}
      borderRadius="4px"
      bg="white"
      border="1px solid"
      borderColor="primary.500"
      boxShadow="0 0 0 1px var(--chakra-colors-primary-500)"
      transitionProperty="common"
      transitionDuration="normal"
    >
      <Box py="1.5rem" px={{ base: '1.5rem', md: '2rem' }}>
        <StepLabel stepNumber={stepNumber} />
      </Box>
      <RespondentBlock
        stepNumber={stepNumber}
        formMethods={formMethods}
        isLoading={isLoading}
      />
      <QuestionsBlock formMethods={formMethods} isLoading={isLoading} />
      {!isFirstStep ? <ApprovalsBlock formMethods={formMethods} /> : null}
      <SaveActionGroup
        isLoading={isLoading}
        handleSubmit={handleSubmit}
        handleDelete={isFirstStep ? undefined : handleOpenDeleteModal}
        handleCancel={setToInactive}
        submitButtonLabel={submitButtonLabel}
        ariaLabelName="step"
      />
    </Stack>
  )
}
