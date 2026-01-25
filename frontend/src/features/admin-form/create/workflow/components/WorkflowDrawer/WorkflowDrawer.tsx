import { useCallback, useEffect, useMemo } from 'react'
import { Box, Divider, Flex } from '@chakra-ui/react'

import { FormWorkflowStep } from '~shared/types'

import { datadogRum } from '~utils/datadog'

import { StatusTrackerToggle } from '~/features/admin-form/settings/components/EmailNotificationsSection/StatusTrackerToggle'

import {
  createOrEditDataSelector,
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { AdminEditWorkflowState } from '../../types'
import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { useWorkflowMutations } from '../../mutations'
import { EditStepBlock } from '../WorkflowContent/EditStepBlock'
import { WorkflowCompletionMessageBlock } from '../WorkflowContent/WorkflowCompletionMessageBlock'

import { WorkflowDrawerContainer } from './WorkflowDrawerContainer'

const handleTracking = (step: FormWorkflowStep, stepNumber: number) => {
  // stepNumber is 0-indexed
  if (stepNumber === 0) {
    const hasFieldsSelected = step.edit.length > 0
    if (hasFieldsSelected) {
      datadogRum.addAction(
        'workflow_builder.workflow_drawer.step_one_save_action',
      )
    }
  }

  if (stepNumber === 1) {
    const hasFieldsSelected = step.edit.length > 0
    if (hasFieldsSelected) {
      datadogRum.addAction(
        'workflow_builder.workflow_drawer.step_two_save_action',
      )
    }
  }
}

export const WorkflowDrawer = (): JSX.Element => {
  const createOrEditData = useAdminWorkflowStore(createOrEditDataSelector)
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const { formWorkflow } = useAdminFormWorkflow()
  const { updateStepMutation, deleteStepMutation, createStepMutation } =
    useWorkflowMutations()
  // Step deletion protection: if editing a step that no longer exists, close the drawer
  useEffect(() => {
    if (
      createOrEditData?.state === AdminEditWorkflowState.EditingStep &&
      formWorkflow
    ) {
      const stepExists = formWorkflow[createOrEditData.stepNumber] !== undefined
      if (!stepExists) {
        setToInactive()
      }
    }
  }, [createOrEditData, formWorkflow, setToInactive])

  const isEditingStep =
    createOrEditData?.state === AdminEditWorkflowState.EditingStep
  const isCreatingStep =
    createOrEditData?.state === AdminEditWorkflowState.CreatingStep
  const isEditingOrCreating = isEditingStep || isCreatingStep

  const currentStep = useMemo(() => {
    if (isCreatingStep) {
      // For creating, return empty default values
      return { edit: [] }
    }
    if (!isEditingStep || !formWorkflow) return null
    return formWorkflow[createOrEditData.stepNumber]
  }, [isCreatingStep, isEditingStep, formWorkflow, createOrEditData])

  const stepNumber = isEditingStep
    ? createOrEditData.stepNumber
    : formWorkflow?.length ?? 0
  const drawerTitle = useMemo(() => {
    if (isCreatingStep) {
      return 'Add Step'
    }
    if (isEditingStep && currentStep && 'step_name' in currentStep) {
      const stepName = currentStep.step_name
      return stepName ? `Edit ${stepName}` : `Edit Step ${stepNumber + 1}`
    }
    return 'Workflow Settings'
  }, [isCreatingStep, isEditingStep, currentStep, stepNumber])

  const handleCancel = useCallback(() => {
    if (isCreatingStep) {
      // Just close when canceling creation
      setToInactive()
      return
    }
    if (!isEditingStep || !currentStep) {
      setToInactive()
      return
    }

    // If this is the first step with no fields assigned and it's the only step,
    // delete it instead of just closing the edit view
    const isFirstStep = stepNumber === 0
    const hasNoFields = currentStep.edit.length === 0
    const isOnlyStep = formWorkflow?.length === 1

    if (isFirstStep && hasNoFields && isOnlyStep) {
      deleteStepMutation.mutate(stepNumber, {
        onSuccess: () => setToInactive(),
      })
    } else {
      setToInactive()
    }
  }, [
    isEditingStep,
    currentStep,
    stepNumber,
    formWorkflow?.length,
    deleteStepMutation,
    setToInactive,
  ])

  const handleSubmit = useCallback(
    (step: FormWorkflowStep) => {
      if (isCreatingStep) {
        // Handle creation
        createStepMutation.mutate(step, {
          onSuccess: () => setToInactive(),
          onError: () => setToInactive(),
        })
        return
      }
      if (!isEditingStep) return
      handleTracking(step, stepNumber)
      updateStepMutation.mutate(
        {
          stepNumber,
          updateStepBody: step,
        },
        {
          onSuccess: () => setToInactive(),
        },
      )
    },
    [
      isCreatingStep,
      createStepMutation,
      updateStepMutation,
      stepNumber,
      setToInactive,
      isEditingStep,
    ],
  )

  return (
    <>
      <Flex pos="relative" h="100%" display="flex" flexDir="column">
        <WorkflowDrawerContainer
          title={drawerTitle}
          showBackButton={isEditingOrCreating}
          isLoading={
            updateStepMutation.isLoading ||
            deleteStepMutation.isLoading ||
            createStepMutation.isLoading
          }
        >
          {/* Content section - scrollable */}
          <Box flex={1} overflowY="auto" bg="white">
            {isEditingOrCreating && currentStep ? (
              <EditStepBlock
                stepNumber={stepNumber}
                isLoading={updateStepMutation.isLoading}
                handleCancel={handleCancel}
                onSubmit={handleSubmit}
                defaultValues={currentStep}
                submitButtonLabel={isCreatingStep ? 'Add step' : 'Save step'}
              />
            ) : (
              <Box pb="1rem" px="1.5rem" pt="1.5rem">
                <Box maxW="100%">
                  <StatusTrackerToggle />
                  <Divider my="1.5rem" mx="-1.5rem" w="auto" />
                  <WorkflowCompletionMessageBlock />
                </Box>
              </Box>
            )}
          </Box>
        </WorkflowDrawerContainer>
      </Flex>
    </>
  )
}
