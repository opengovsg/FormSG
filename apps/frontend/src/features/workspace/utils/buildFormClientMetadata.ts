import { FormMetadata, FormOrigin, FormResponseMode } from 'formsg-shared/types'

export const buildFormClientMetadata = ({
  isPaperTrackingSetUpPageEnabled,
  isMrfCutoverEnabled,
  formOrigin,
  formResponseMode,
}: {
  isPaperTrackingSetUpPageEnabled: boolean
  isMrfCutoverEnabled: boolean
  formOrigin: FormOrigin | undefined
  formResponseMode: FormResponseMode
}): Pick<FormMetadata, 'formOrigins'> | undefined => {
  const isEscapeHatchFlow =
    isMrfCutoverEnabled && formResponseMode === FormResponseMode.Encrypt

  if (!isPaperTrackingSetUpPageEnabled || isEscapeHatchFlow || !formOrigin) {
    return undefined
  }

  return { formOrigins: { value: [formOrigin] } }
}
