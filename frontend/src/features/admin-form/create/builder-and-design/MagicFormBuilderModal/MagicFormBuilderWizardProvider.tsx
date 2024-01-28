import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from 'react-query'

import { MagicFormBuilderMode } from '~shared/types'

import {
  MagicFormBuilderFlowStates,
  MagicFormBuilderWizardContext,
  MagicFormBuilderWizardContextReturn,
  MagicFormBuilderWizardInputProps,
} from './MagicFormBuilderWizardContext'

export const INITIAL_STEP_STATE: [MagicFormBuilderFlowStates, -1 | 1 | 0] = [
  MagicFormBuilderFlowStates.Landing,
  -1,
]

interface UseCommonFormWizardProviderProps {
  defaultValues?: Partial<MagicFormBuilderWizardInputProps>
}

export const useMagicFormBuilderWizardProvider = ({
  defaultValues,
}: UseCommonFormWizardProviderProps = {}) => {
  const [[currentStep, direction], setCurrentStep] =
    useState(INITIAL_STEP_STATE)

  const formMethods = useForm<MagicFormBuilderWizardInputProps>({
    defaultValues,
  })

  return {
    formMethods,
    currentStep,
    direction,
    setCurrentStep,
  }
}

const useMagicFormBuilderWizardContext =
  (): MagicFormBuilderWizardContextReturn => {
    const { formMethods, currentStep, direction, setCurrentStep } =
      useMagicFormBuilderWizardProvider({
        defaultValues: {
          magicFormBuilderMode: MagicFormBuilderMode.Pdf,
        },
      })

    const { handleSubmit } = formMethods

    /**
     * Mock the mutations first
     * TODO: Wire up with actual mutations
     */
    const mockPromptMutation = useMutation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('success')
        }, 2000)
      })
    })

    const mockPdfMutation = useMutation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('success')
        }, 2000)
      })
    })

    const handleDetailsSubmit = handleSubmit((inputs) => {
      if (currentStep === MagicFormBuilderFlowStates.Landing) {
        if (inputs.magicFormBuilderMode === MagicFormBuilderMode.Pdf) {
          setCurrentStep([MagicFormBuilderFlowStates.PdfDetails, 1])
        }

        if (inputs.magicFormBuilderMode === MagicFormBuilderMode.Prompt) {
          setCurrentStep([MagicFormBuilderFlowStates.PromptDetails, 1])
        }
      }

      if (currentStep === MagicFormBuilderFlowStates.PdfDetails) {
        mockPdfMutation.mutate()
      }

      if (currentStep === MagicFormBuilderFlowStates.PromptDetails) {
        mockPromptMutation.mutate()
      }
    })

    const handleBack = () => {
      if (
        currentStep === MagicFormBuilderFlowStates.PdfDetails ||
        currentStep === MagicFormBuilderFlowStates.PromptDetails
      ) {
        setCurrentStep([MagicFormBuilderFlowStates.Landing, -1])
      }
    }

    return {
      isFetching: false,
      isLoading: mockPdfMutation.isLoading || mockPromptMutation.isLoading,
      currentStep,
      direction,
      formMethods,
      handleDetailsSubmit,
      handleBack,
      modalHeader: 'Build your form with AI or PDF',
    }
  }

export const MagicFormBuilderWizardProvider = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  const values = useMagicFormBuilderWizardContext()
  return (
    <MagicFormBuilderWizardContext.Provider value={values}>
      {children}
    </MagicFormBuilderWizardContext.Provider>
  )
}
