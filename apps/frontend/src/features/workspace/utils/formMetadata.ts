import { FormOrigin } from 'formsg-shared/types'

export type PaperFormAnswer = 'yes' | 'no'

export interface FormWizardAnswers {
  isPaperForm: PaperFormAnswer
}

export interface FormMetadataPayload {
  formOrigin: FormOrigin
}

/**
 * Single source of truth for turning form-creation wizard answers into the
 * metadata persisted on the form record. Pure: no UI, no network.
 */
export const mapWizardAnswersToFormMetadata = ({
  isPaperForm,
}: FormWizardAnswers): FormMetadataPayload => {
  return {
    formOrigin:
      isPaperForm === 'yes' ? FormOrigin.Paper : FormOrigin.Unspecified,
  }
}
