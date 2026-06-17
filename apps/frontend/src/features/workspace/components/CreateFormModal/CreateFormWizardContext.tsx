/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react'
import { UseFormHandleSubmit, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  FormResponseMode,
  PublicFormViewDto,
} from 'formsg-shared/types/form/form'
import { CheckboxFieldResponsesV3 } from 'formsg-shared/types/response-v3'

import formsgSdk from '~utils/formSdk'
import { CheckboxFieldValues } from '~templates/Field'

export enum CreateFormFlowStates {
  Landing = 'landing',
  Details = 'details',
  // Paper-forms tracking: form-origin capture (Screen 2), shown between Details
  // and form creation when `enablePaperTrackingSetUpPage` is on.
  Origin = 'origin',
  StorageModeDetails = 'storageModeDetails',
  EmailFeedback = 'emailFeedback',
  EmailModeCreation = 'emailModeCreation',
}

export interface CreateFormWizardInputProps {
  title: string
  responseMode: FormResponseMode
  // Email form props
  emails?: string[]
  // Storage form props
  storageAck?: boolean

  // Paper-forms tracking: the source(s) the form replaced, captured on the
  // origin step and persisted to the created form's `metadata`. Held as the
  // exact type the backend persists (`CheckboxFieldResponsesV3`): `value`
  // carries the selected origin codes plus the CLIENT_CHECKBOX_OTHERS_INPUT_VALUE
  // sentinel when "Other" is ticked, and `othersInput` carries the "Other" text.
  formOrigins?: CheckboxFieldResponsesV3

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
  // Paper-forms tracking: advances Details → Origin (when the origin step is
  // enabled) or creates the form directly (when it is not).
  handleProceedFromDetails: ReturnType<
    UseFormHandleSubmit<CreateFormWizardInputProps>
  >
  goToFormDetails: () => void
  isPaperTrackingSetUpPageEnabled: boolean
  // Paper-forms tracking: copy for the title-step proceed button — "Next step"
  // when the origin step is enabled, "Create form" otherwise. Computed by the
  // provider so screens render it without reading the flag.
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
