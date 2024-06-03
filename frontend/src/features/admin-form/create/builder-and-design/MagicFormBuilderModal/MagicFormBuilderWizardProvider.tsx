import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from '~shared/constants'
import { MagicFormBuilderMode } from '~shared/types'

import { useToast } from '~hooks/useToast'

import { useAssistanceMutations } from '~features/admin-form/assistance/mutations'
import { adminFormKeys } from '~features/admin-form/common/queries'

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

const useMagicFormBuilderWizardContext = (
  onClose: () => void,
): MagicFormBuilderWizardContextReturn => {
  const { formMethods, currentStep, direction, setCurrentStep } =
    useMagicFormBuilderWizardProvider()

  const { formId } = useParams()

  if (!formId) {
    throw new Error('Form ID is required')
  }

  const { handleSubmit } = formMethods

  const { createFieldsFromPromptMutation, createFieldsFromPdfMutation } =
    useAssistanceMutations()
  const toast = useToast({ status: 'success', isClosable: true })

  const queryClient = useQueryClient()

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
      createFieldsFromPdfMutation.mutate(inputs.pdfFileText, {
        onSuccess: () => {
          queryClient.invalidateQueries(adminFormKeys.id(formId))
          onClose()
          toast({
            description: 'Successfully created form',
          })
        },
        onError: (error) => {
          console.error(error)
        },
      })
    }

    if (currentStep === MagicFormBuilderFlowStates.PromptDetails) {
      createFieldsFromPromptMutation.mutate(inputs.prompt, {
        onSuccess: () => {
          onClose()
          toast({
            description: 'Successfully created form',
          })
        },
        onError: (error) => {
          console.error(error)
        },
      })
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
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}): JSX.Element => {
  const values = useMagicFormBuilderWizardContext(onClose)
  return (
    <MagicFormBuilderWizardContext.Provider value={values}>
      {children}
    </MagicFormBuilderWizardContext.Provider>
  )
}
