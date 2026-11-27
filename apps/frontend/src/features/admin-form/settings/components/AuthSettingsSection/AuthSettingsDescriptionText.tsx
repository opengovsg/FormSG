import { useTranslation } from 'react-i18next'
import { Text } from '@chakra-ui/react'

import { GUIDE_SPCP_ESRVCID } from '~constants/links'
import Link from '~components/Link'

import { useIsMrfStepLoginEnabled } from '~features/admin-form/create/workflow/hooks/useIsMrfStepLoginEnabled'

export const AuthSettingsDescriptionText = () => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.singpass',
  })
  const isStepLoginOn = useIsMrfStepLoginEnabled()
  return (
    <Text textStyle="subhead-1" color="secondary.500" mb="2.5rem" mt="2.5rem">
      {isStepLoginOn ? null : `${t('description')} `}
      <Link
        textStyle="subhead-1"
        href={GUIDE_SPCP_ESRVCID}
        isExternal
        // Needed for link to open since there are nested onClicks
        onClickCapture={(e) => e.stopPropagation()}
      >
        {t(isStepLoginOn ? 'learnMoreMyinfo' : 'learnMore')}
      </Link>
    </Text>
  )
}
