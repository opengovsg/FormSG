import { UseFormReturn } from 'react-hook-form'
import { As } from '@chakra-ui/react'

import { WorkflowType } from '~shared/types/form/workflow'

import { EditStepInputs } from '~features/admin-form/create/workflow/types'

export interface RespondentOptionProps {
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
  selectedWorkflowType: WorkflowType
}

export interface FieldItem {
  label: string
  value: string
  icon?: As
}
