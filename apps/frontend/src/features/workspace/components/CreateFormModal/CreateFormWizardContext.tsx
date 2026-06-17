/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react'
import { UseFormHandleSubmit, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import {
  FormMetadata,
  FormResponseMode,
  PublicFormViewDto,
} from 'formsg-shared/types/form/form'

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
  // origin step and persisted to the created form's `metadata`. Holds the
  // selected origin codes plus the CLIENT_CHECKBOX_OTHERS_INPUT_VALUE sentinel
  // when "Other" is ticked, so it is a plain string[] rather than FormOrigin[].
  formOrigins?: string[]
  formOriginOtherDetail?: string

  // TODO: (Kill Email Mode) Remove this route after kill email mode is fully implemented.
  reason?: CheckboxFieldValues // for kill email mode
}

/**
 * Paper-forms tracking: the single point where the wizard's form state crosses
 * into the backend's create-form `metadata` shape. Shared by the create,
 * duplicate and use-template providers so the encoding rule lives in exactly
 * one place. Returns `{ metadata: { formOrigins } }` to spread into the create
 * payload, or `{}` when the origin step is disabled or nothing was selected.
 *
 * The selected codes (incl. the `CLIENT_CHECKBOX_OTHERS_INPUT_VALUE` sentinel)
 * go in `value`; the typed "Other" text goes in `othersInput`, attached only
 * when "Other" is selected and the text is non-empty.
 */
export const buildFormOriginsMetadata = (
  isPaperTrackingSetUpPageEnabled: boolean,
  formOrigins?: string[],
  formOriginOtherDetail?: string,
): { metadata?: Pick<FormMetadata, 'formOrigins'> } => {
  if (!isPaperTrackingSetUpPageEnabled || !formOrigins?.length) {
    return {}
  }
  return {
    metadata: {
      formOrigins: {
        value: formOrigins,
        ...(formOrigins.includes(CLIENT_CHECKBOX_OTHERS_INPUT_VALUE) &&
        formOriginOtherDetail?.trim()
          ? { othersInput: formOriginOtherDetail.trim() }
          : {}),
      },
    },
  }
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
