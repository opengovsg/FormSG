import { Stack } from '@chakra-ui/react'
import { datadogLogs } from '@datadog/browser-logs'
import { useGrowthBook } from '@growthbook/growthbook-react'

import { featureFlags } from '~shared/constants'

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

  const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'
  const gb = useGrowthBook()
  const enableFloatingSaveDraftButton =
    gb?.isOn(featureFlags.enableSaveDraftButtonFloating) || isTest

  if (submissionData) return null

  return (
    <Stack
      direction={{ base: 'row', md: 'column' }}
      position="fixed"
      spacing="1rem"
      bottom={{ base: '1rem', md: '2.625rem' }}
      right={{ base: '1rem', md: '2.75rem' }}
      sx={noPrintCss}
      zIndex="docked"
    >
      <FloatingIssueFeedbackButton isPreview={isPreview} formId={formId} />
      {isSaveDraftEnabled && enableFloatingSaveDraftButton && (
        <FloatingSaveDraftButton
          onSaveDraft={() => {
            datadogLogs.logger?.log(
              'User clicked save draft from floating toolbar',
              {
                meta: {
                  action: 'saveDraft',
                  variant: 'FloatingToolbar',
                  formId,
                },
              },
            )
            onSaveDraft()
          }}
          draftLastSavedDateTimeString={draftLastSavedDateTimeString}
        />
      )}
    </Stack>
  )
}
