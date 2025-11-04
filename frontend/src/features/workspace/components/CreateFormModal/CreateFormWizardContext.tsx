/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react'
import { UseFormHandleSubmit, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormResponseMode, PublicFormViewDto } from '~shared/types/form/form'

import formsgSdk from '~utils/formSdk'
import { CheckboxFieldValues } from '~templates/Field'

export enum CreateFormFlowStates {
  Landing = 'landing',
  Details = 'details',
  EmailFeedback = 'emailFeedback',
  EmailModeCreation = 'emailModeCreation',
}

export interface CreateFormWizardInputProps {
  title: string
  responseMode: FormResponseMode
  // Email form props
  emails: string[]
  // Storage form props
  storageAck?: boolean

  // TODO: (Kill Email Mode) Remove this route after kill email mode is fully implemented.
  reason?: CheckboxFieldValues // for kill email mode
}

export type CreateFormWizardContextReturn = {
  currentStep: CreateFormFlowStates
  direction: number
  formMethods: UseFormReturn<CreateFormWizardInputProps>
  handleEmailFeedbackSubmit: () => void
  handleCreateEmailModeForm: () => () => void
  submitEmailModeFeedback: (feedbackForm: PublicFormViewDto) => () => void
  handleCreateStorageModeOrMultirespondentForm: ReturnType<
    UseFormHandleSubmit<CreateFormWizardInputProps>
  >
  keypair: ReturnType<typeof formsgSdk.crypto.generate>
  // Whether any async operation is in progress.
  isFetching: boolean
  isLoading: boolean
  modalHeader: string
  isSingpass: boolean
  hasMyInfoChildren: boolean
  onClose: () => void
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
