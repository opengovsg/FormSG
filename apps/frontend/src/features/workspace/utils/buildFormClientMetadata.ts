import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import { FormMetadata } from 'formsg-shared/types'
import { CheckboxFieldResponsesV3 } from 'formsg-shared/types/response-v3'

/**
 * Translates the frontend formOrigins state (for rendering) into the expected payload.
 * Required since for example, `othersInput` can be persisted in frontend state
 * but the `others` option is not selected in the frontend.
 * @param isPaperTrackingSetUpPageEnabled only defined if the paper tracking is enabled.
 * @param formOrigins frontend formOrigins state (for rendering)
 * @returns the expected formOrigins payload for the backend
 */
const buildFormOriginsPayload = (
  isPaperTrackingSetUpPageEnabled: boolean,
  formOrigins: CheckboxFieldResponsesV3 | undefined,
): CheckboxFieldResponsesV3 | undefined => {
  if (
    !isPaperTrackingSetUpPageEnabled ||
    !formOrigins ||
    formOrigins.value.length <= 0
  ) {
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

export const buildFormClientMetadata = (
  isPaperTrackingSetUpPageEnabled: boolean,
  formOrigins: CheckboxFieldResponsesV3 | undefined,
): Pick<FormMetadata, 'formOrigins'> | undefined => {
  const formOriginsPayload = buildFormOriginsPayload(
    isPaperTrackingSetUpPageEnabled,
    formOrigins,
  )
  return formOriginsPayload
    ? {
        formOrigins: formOriginsPayload,
      }
    : undefined
}
