import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { FormResponseMode } from 'formsg-shared/types'

import { ADMINFORM_ROUTE, DASHBOARD_ROUTE } from '~constants/routes'
import formsgSdk from '~utils/formSdk'

import { useCreateFormMutations } from '~features/workspace/mutations'

import { ChooseStartingPointWrapper } from './ChooseStartingPointStep'
import { FormNamePreview } from './FormNamePreview'
import { FormNameStep } from './FormNameStep'
import { MapStepsWrapper } from './MapStepsStep'
import { SecretKeyStep } from './SecretKeyStep'
import { SplitScreenLayout, type WizardStep } from './SplitScreenLayout'
import { useCreateFlowVariant } from './useCreateFlowVariant'

export interface CreateFormFlowV2Inputs {
  title: string
}

export const CreateFormFlowV2Page = (): JSX.Element => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<WizardStep>('name')
  const [formId, setFormId] = useState<string>('')

  // No workspace context on this route; forms land in "All Forms" by default

  const keypair = useMemo(() => formsgSdk.crypto.generate(), [])

  const formMethods = useForm<CreateFormFlowV2Inputs>({
    defaultValues: { title: '' },
  })

  const { createMultirespondentModeFormMutation } = useCreateFormMutations()

  const handleCreateForm = useCallback(() => {
    const title = formMethods.getValues('title')
    if (!title) return

    createMultirespondentModeFormMutation.mutate(
      {
        title,
        responseMode: FormResponseMode.Multirespondent,
        publicKey: keypair.publicKey,
      },
      {
        onSuccess: (data) => {
          setFormId(data._id)
          setCurrentStep('secretKey')
        },
      },
    )
  }, [formMethods, createMultirespondentModeFormMutation, keypair.publicKey])

  const handleCancel = useCallback(() => {
    navigate(DASHBOARD_ROUTE)
  }, [navigate])

  const createFlowVariant = useCreateFlowVariant()

  const handleSecretKeyNext = useCallback(() => {
    if (createFlowVariant === 'c') {
      navigate(`${ADMINFORM_ROUTE}/${formId}`)
    } else {
      setCurrentStep('mapSteps')
    }
  }, [createFlowVariant, navigate, formId])

  const title = formMethods.watch('title')

  // Step 3: render the appropriate variant
  if (currentStep === 'mapSteps') {
    if (createFlowVariant && createFlowVariant === 'b') {
      return <ChooseStartingPointWrapper formId={formId} />
    }
    // Default to variant A (MapStepsWrapper owns its own SplitScreenLayout + DndContext)
    return <MapStepsWrapper formId={formId} />
  }

  const leftPanel = (() => {
    switch (currentStep) {
      case 'name':
        return (
          <FormNameStep
            formMethods={formMethods}
            onSubmit={handleCreateForm}
            onCancel={handleCancel}
            isLoading={createMultirespondentModeFormMutation.isLoading}
          />
        )
      case 'secretKey':
        return (
          <SecretKeyStep
            secretKey={keypair.secretKey}
            formTitle={title}
            formId={formId}
            onNext={handleSecretKeyNext}
          />
        )
      default:
        return null
    }
  })()

  const rightPanel = (() => {
    switch (currentStep) {
      case 'name':
        return <FormNamePreview title={title} />
      case 'secretKey':
        return <FormNamePreview title={title} />
      default:
        return null
    }
  })()

  return (
    <SplitScreenLayout
      currentStep={currentStep}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    />
  )
}

export default CreateFormFlowV2Page
