import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import { FormMetadata, FormOrigin, FormResponseMode } from 'formsg-shared/types'
import { CheckboxFieldResponsesV3 } from 'formsg-shared/types/response-v3'

import { FormOriginProcessAnswer } from '~features/workspace/components/CreateFormModal/CreateFormWizardContext'

/**
 * Translates the wizard's Q1 (process) + Q2 (medium) state into the expected
 * formOrigins payload. New process short-circuits to the new-process value
 * alone, discarding any medium selections retained in Q2's UI state.
 * @param isPaperTrackingSetUpPageEnabled only defined if the paper tracking is enabled.
 * @param formOriginProcess Q1's raw answer.
 * @param formOrigins Q2's frontend state (mediums + others detail, for rendering).
 * @returns the expected formOrigins payload for the backend
 */
const buildFormOriginsPayload = (
  isPaperTrackingSetUpPageEnabled: boolean,
  formOriginProcess: FormOriginProcessAnswer | undefined,
  formOrigins: CheckboxFieldResponsesV3 | undefined,
): CheckboxFieldResponsesV3 | undefined => {
  if (!isPaperTrackingSetUpPageEnabled) {
    return undefined
  }

  if (formOriginProcess === 'new') {
    return { value: [FormOrigin.DigitalNew] }
  }

  if (!formOrigins || formOrigins.value.length <= 0) {
    return undefined
  }

  const trimmedOthersInput = formOrigins.othersInput?.trim()
  const hasOthersInput =
    formOrigins.value.includes(CLIENT_CHECKBOX_OTHERS_INPUT_VALUE) &&
    trimmedOthersInput

  return {
    value: formOrigins.value,
    othersInput: hasOthersInput ? trimmedOthersInput : undefined,
  }
}

export const buildFormClientMetadata = ({
  isPaperTrackingSetUpPageEnabled,
  isMrfCutoverEnabled,
  formOriginProcess,
  formOrigins,
  formResponseMode,
}: {
  isPaperTrackingSetUpPageEnabled: boolean
  isMrfCutoverEnabled: boolean
  formOriginProcess: FormOriginProcessAnswer | undefined
  formOrigins: CheckboxFieldResponsesV3 | undefined
  formResponseMode: FormResponseMode
}): Pick<FormMetadata, 'formOrigins'> | undefined => {
  const isEscapeHatchFlow =
    isMrfCutoverEnabled && formResponseMode === FormResponseMode.Encrypt
  const formOriginsPayload = !isEscapeHatchFlow
    ? buildFormOriginsPayload(
        isPaperTrackingSetUpPageEnabled,
        formOriginProcess,
        formOrigins,
      )
    : undefined

  return formOriginsPayload
    ? {
        formOrigins: formOriginsPayload,
      }
    : undefined
}
