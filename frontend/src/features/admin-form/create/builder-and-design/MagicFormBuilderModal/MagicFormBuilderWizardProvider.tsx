import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from 'react-query'
import { useFeatureIsOn, useGrowthBook } from '@growthbook/growthbook-react'

import { featureFlags } from '~shared/constants'
import { MagicFormBuilderMode } from '~shared/types'

import { useAssistanceMutations } from '~features/admin-form/assistance/mutations'

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

export const useMagicFormBuilderWizardProvider = () => {
  const [[currentStep, direction], setCurrentStep] =
    useState(INITIAL_STEP_STATE)

  const growthbook = useGrowthBook()

  useEffect(() => {
    // Load features asynchronously when the app renders
    if (growthbook) {
      growthbook.loadFeatures()
    }
  }, [growthbook])

  const showMagicFormPDFButton = useFeatureIsOn(
    featureFlags.magicFormBuilderPDF,
  )

  const formMethods = useForm<MagicFormBuilderWizardInputProps>({
    defaultValues: {
      magicFormBuilderMode: !showMagicFormPDFButton
        ? MagicFormBuilderMode.Prompt
        : MagicFormBuilderMode.Pdf,
    },
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
      useMagicFormBuilderWizardProvider()

    const { handleSubmit } = formMethods

    /**
     * Mock the mutations first
     * TODO: Wire up with actual mutations
     */

    const mockPdfMutation = useMutation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('success')
        }, 2000)
      })
    })

    const { createFieldsFromPromptMutation, createFieldsFromPdfMutation } =
      useAssistanceMutations()

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
        createFieldsFromPdfMutation.mutate(inputs.pdfFileText)
      }

      if (currentStep === MagicFormBuilderFlowStates.PromptDetails) {
        createFieldsFromPromptMutation.mutate(inputs.prompt)
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
      isLoading:
        createFieldsFromPdfMutation.isLoading ||
        createFieldsFromPromptMutation.isLoading,
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
