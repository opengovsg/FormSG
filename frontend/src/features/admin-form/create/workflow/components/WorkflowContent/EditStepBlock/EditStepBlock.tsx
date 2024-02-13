import { useLayoutEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Box, Stack } from '@chakra-ui/react'
import { merge } from 'lodash'

import { SaveActionGroup } from '~features/admin-form/create/logic/components/LogicContent/EditLogicBlock/EditCondition'

import {
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { EditStepInputs } from '../../../types'
import { StepLabel } from '../StepLabel'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { RespondentBlock } from './RespondentBlock'

export interface EditLogicBlockProps {
  /** Sets default values of inputs if this is provided */
  defaultValues?: Partial<EditStepInputs>
  onSubmit: (inputs: EditStepInputs) => void

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
    defaultValues: merge({ emails: [] }, defaultValues),
    shouldUnregister: true,
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

  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  const handleSubmit = formMethods.handleSubmit((inputs) => onSubmit(inputs))

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
      <Box
        py="1.5rem"
        px={{ base: '1.5rem', md: '2rem' }}
        borderBottomWidth="1px"
        borderBottomColor="secondary.200"
      >
        <StepLabel stepNumber={stepNumber} />
      </Box>
      <RespondentBlock
        stepNumber={stepNumber}
        formMethods={formMethods}
        isLoading={isLoading}
      />
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
