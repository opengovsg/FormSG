import { createContext, useContext } from 'react'
import { UseFormHandleSubmit, UseFormReturn } from 'react-hook-form'

import { MagicFormBuilderMode } from '~shared/types/form/form'

export enum MagicFormBuilderFlowStates {
  Landing = 'landing',
  PromptDetails = 'prompt-details',
  PdfDetails = 'pdf-details',
}

export type MagicFormBuilderWizardInputProps = {
  title: string
  magicFormBuilderMode: MagicFormBuilderMode
  // PDF mode props
  pdfFileText: string
  // Prompt mode props
  prompt: string
}

export type MagicFormBuilderWizardContextReturn = {
  currentStep: MagicFormBuilderFlowStates
  direction: number
  formMethods: UseFormReturn<MagicFormBuilderWizardInputProps>
  handleDetailsSubmit: ReturnType<
    UseFormHandleSubmit<MagicFormBuilderWizardInputProps>
  >
  handleBack: () => void

  // Whether any async operation is in progress.
  isFetching: boolean
  isLoading: boolean
  modalHeader: string
}

export const MagicFormBuilderWizardContext = createContext<
  MagicFormBuilderWizardContextReturn | undefined
>(undefined)

export const useMagicFormBuilderWizard =
  (): MagicFormBuilderWizardContextReturn => {
    const context = useContext(MagicFormBuilderWizardContext)
    if (!context) {
      throw new Error(
        `useMagicFormBuilderWizard must be used within a MagicFormBuilderWizardProvider component`,
      )
    }
    return context
  }
