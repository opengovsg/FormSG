import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { FormResponseMode } from 'formsg-shared/types'

import { ADMINFORM_ROUTE, DASHBOARD_ROUTE } from '~constants/routes'
import formsgSdk from '~utils/formSdk'

import { useUser } from '~features/user/queries'
import { useCreateFormMutations } from '~features/workspace/mutations'

import { FormNamePreview } from './FormNamePreview'
import { FormNameStep } from './FormNameStep'
import { FormOriginValue } from './OriginSelection'
import { OriginStep } from './OriginStep'
import { SecretKeyStep } from './SecretKeyStep'
import { SplitScreenLayout, type WizardStep } from './SplitScreenLayout'
import { StorageModeNameStep } from './StorageModeNameStep'
import { StorageModeOriginStep } from './StorageModeOriginStep'

export interface CreateFormFlowV2Inputs {
  title: string
}

export const CreateFormFlowV2Page = (): JSX.Element => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<WizardStep>('name')
  const [formId, setFormId] = useState<string>('')
  const [_originData, setOriginData] = useState<{
    selected: FormOriginValue[]
    othersText: string
  }>({ selected: [], othersText: '' })

  const keypair = useMemo(() => formsgSdk.crypto.generate(), [])

  const formMethods = useForm<CreateFormFlowV2Inputs>({
    defaultValues: { title: '' },
  })

  const { user } = useUser()
  const adminEmail = user?.email

  const {
    createMultirespondentModeFormMutation,
    createStorageModeFormMutation,
  } = useCreateFormMutations()

  // MRF form creation
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
          setCurrentStep('origin')
        },
      },
    )
  }, [formMethods, createMultirespondentModeFormMutation, keypair.publicKey])

  // Storage mode form creation
  const handleCreateStorageForm = useCallback(() => {
    const title = formMethods.getValues('title')
    if (!title) return

    const defaultEmails = adminEmail ? [adminEmail] : []
    createStorageModeFormMutation.mutate(
      {
        title,
        responseMode: FormResponseMode.Encrypt,
        publicKey: keypair.publicKey,
        emails: defaultEmails,
      },
      {
        onSuccess: (data) => {
          setFormId(data._id)
          setCurrentStep('storageOrigin')
        },
      },
    )
  }, [
    formMethods,
    createStorageModeFormMutation,
    keypair.publicKey,
    adminEmail,
  ])

  const handleCancel = useCallback(() => {
    navigate(DASHBOARD_ROUTE)
  }, [navigate])

  const handleEscapeHatch = useCallback(() => {
    setCurrentStep('storageName')
  }, [])

  const handleOriginNext = useCallback(
    (selected: FormOriginValue[], othersText: string) => {
      setOriginData({ selected, othersText })
      // TODO: persist origin data to form metadata via API
      setCurrentStep('secretKey')
    },
    [],
  )

  const handleStorageOriginNext = useCallback(
    (
      _storageReasons: string[],
      _originSelected: FormOriginValue[],
      _othersText: string,
    ) => {
      // TODO: persist storage reasons + origin data via API
      setCurrentStep('secretKey')
    },
    [],
  )

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
            onEscapeHatch={handleEscapeHatch}
            isLoading={createMultirespondentModeFormMutation.isLoading}
          />
        )
      case 'origin':
        return <OriginStep onNext={handleOriginNext} />
      case 'storageName':
        return (
          <StorageModeNameStep
            formMethods={formMethods}
            onSubmit={handleCreateStorageForm}
            isLoading={createStorageModeFormMutation.isLoading}
          />
        )
      case 'storageOrigin':
        return <StorageModeOriginStep onNext={handleStorageOriginNext} />
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

  const rightPanel = <FormNamePreview title={title} />

  return (
    <SplitScreenLayout
      currentStep={currentStep}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    />
  )
}

export default CreateFormFlowV2Page
