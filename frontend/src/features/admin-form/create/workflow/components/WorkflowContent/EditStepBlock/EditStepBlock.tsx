import { useLayoutEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Box, Divider, Stack } from '@chakra-ui/react'
import { merge } from 'lodash'

import {
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { EditStepInputs } from '../../../types'
import { StepLabel } from '../StepLabel'

import { RespondentBlock, SaveActionGroup } from './components'

export interface UseEditStepBlockProps {
  /** Sets default values of inputs if this is provided */
  defaultValues?: Partial<EditStepInputs>
  onSubmit: (inputs: EditStepInputs) => void
}

export const useEditStepBlock = ({
  defaultValues,
  onSubmit,
}: UseEditStepBlockProps) => {
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const { formWorkflow } = useAdminFormWorkflow()

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

  const handleSubmit = formMethods.handleSubmit((inputs) => onSubmit(inputs))

  return {
    formWorkflow,
    formMethods,
    handleSubmit,
    wrapperRef,
    setToInactive,
  }
}

export interface EditLogicBlockProps extends UseEditStepBlockProps {
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
  const { formMethods, wrapperRef, handleSubmit, setToInactive } =
    useEditStepBlock({ defaultValues, onSubmit })

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
      divider={<Divider />}
    >
      <Box py="1.5rem" px={{ base: '1.5rem', md: '2rem' }}>
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
        handleDelete={handleOpenDeleteModal}
        handleCancel={setToInactive}
        submitButtonLabel={submitButtonLabel}
      />
    </Stack>
  )
}
