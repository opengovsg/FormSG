import { Stack } from '@chakra-ui/react'

import { noPrintCss } from '~utils/noPrintCss'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FloatingIssueFeedbackButton } from './FloatingIssueFeedbackButton'
import { FloatingSaveDraftButton } from './FloatingSaveDraftButton'

export const FloatingToolBar = (): JSX.Element | null => {
  const {
    isPreview,
    formId,
    submissionData,
    isSaveDraftEnabled,
    onSaveDraft,
    draftLastSavedDateTimeString,
  } = usePublicFormContext()
  if (submissionData) return null

  return (
    <Stack
      direction={{ base: 'row', md: 'column' }}
      position="fixed"
      spacing="1rem"
      bottom="2rem"
      right="2rem"
      sx={noPrintCss}
      zIndex="docked"
    >
      <FloatingIssueFeedbackButton isPreview={isPreview} formId={formId} />
      {isSaveDraftEnabled && (
        <FloatingSaveDraftButton
          onSaveDraft={onSaveDraft}
          draftLastSavedDateTimeString={draftLastSavedDateTimeString}
        />
      )}
    </Stack>
  )
}
