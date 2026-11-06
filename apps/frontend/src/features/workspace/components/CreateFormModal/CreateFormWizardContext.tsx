/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react'
import { UseFormHandleSubmit, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormResponseMode } from 'formsg-shared/types/form/form'
import { CheckboxFieldResponsesV3 } from 'formsg-shared/types/response-v3'

import formsgSdk from '~utils/formSdk'

export enum CreateFormFlowStates {
  Landing = 'landing',
  Details = 'details',
  Origin = 'origin',
  StorageModeDetails = 'storageModeDetails',
}

export type FormOriginProcessAnswer = 'new' | 'existing'

export interface CreateFormWizardInputProps {
  title: string
  responseMode: FormResponseMode
  // Email form props
  emails?: string[]
  // Storage form props
  storageAck?: boolean
  // Q1: whether the data collection is a new or existing process.
  formOriginProcess?: FormOriginProcessAnswer
  // Q2: mediums already used to collect this data today (only answered when
  // formOriginProcess is 'existing').
  formOrigins?: CheckboxFieldResponsesV3
}

export type CreateFormWizardContextReturn = {
  currentStep: CreateFormFlowStates
  direction: number
  formMethods: UseFormReturn<CreateFormWizardInputProps>
  handleCreateStorageModeOrMultirespondentForm: ReturnType<
    UseFormHandleSubmit<CreateFormWizardInputProps>
  >
  handleProceedFromDetails: ReturnType<
    UseFormHandleSubmit<CreateFormWizardInputProps>
  >
  goToFormDetails: () => void
  isPaperTrackingSetUpPageEnabled: boolean
  isLegacySetup: boolean
  proceedCtaLabel: string
  keypair: ReturnType<typeof formsgSdk.crypto.generate>
  // Whether any async operation is in progress.
  isFetching: boolean
  isLoading: boolean
  modalHeader: string
  isSingpass: boolean
  hasMyInfoChildren: boolean
  onClose: () => void
  isMrfCutoverEnabled: boolean
  goToStorageModeDetails: () => void
  goToMrfDetails: () => void
}

export const CreateFormWizardContext = createContext<
  CreateFormWizardContextReturn | undefined
>(undefined)

export const useCreateFormWizard = (): CreateFormWizardContextReturn => {
  const { t } = useTranslation()
  const context = useContext(CreateFormWizardContext)
  if (!context) {
    throw new Error(
      t('features.workspace.modals.forms.create.errors.useWizardWithinContext'),
    )
  }
  return context
}
