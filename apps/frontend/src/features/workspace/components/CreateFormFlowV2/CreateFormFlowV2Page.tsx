import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { FormResponseMode } from 'formsg-shared/types'

import { ADMINFORM_ROUTE, DASHBOARD_ROUTE } from '~constants/routes'
import formsgSdk from '~utils/formSdk'

import { useCreateFormMutations } from '~features/workspace/mutations'

import { FormNamePreview } from './FormNamePreview'
import { FormNameStep } from './FormNameStep'
import { SecretKeyStep } from './SecretKeyStep'
import { SplitScreenLayout, type WizardStep } from './SplitScreenLayout'

export interface CreateFormFlowV2Inputs {
  title: string
}

export const CreateFormFlowV2Page = (): JSX.Element => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<WizardStep>('name')
  const [formId, setFormId] = useState<string>('')

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

  const handleSecretKeyNext = useCallback(() => {
    navigate(`${ADMINFORM_ROUTE}/${formId}`)
  }, [navigate, formId])

  const title = formMethods.watch('title')

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
