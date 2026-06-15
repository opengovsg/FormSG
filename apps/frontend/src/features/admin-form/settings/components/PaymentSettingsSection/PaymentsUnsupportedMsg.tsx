import { useTranslation } from 'react-i18next'
import { Flex, Text } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

import Link from '~components/Link'

import { SettingsUnsupportedSvgr } from '~features/admin-form/settings/svgrs/SettingsUnsupportedSvgr'

import { usePaymentGuideLink } from './queries'

// TODO [MRF-CUTOVER]: Remove cutover copy overrides after cutover.
const CUTOVER_SHORT_DESCRIPTION =
  'Payments are only available in the legacy version of FormSG'
const CUTOVER_LONG_DESCRIPTION =
  'Respondents can now make payment for fees or services directly on your form. This feature is only available in the legacy version of FormSG.'

export const PaymentsUnsupportedMsg = (): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.payments.paymentUnsupportedMsg',
  })
  const isMrfCutoverEnabled = useFeatureIsOn(featureFlags.mrfCutover)
  const { data: paymentGuideLink } = usePaymentGuideLink()
  return (
    <Flex justify="center" flexDir="column" textAlign="center">
      <Text textStyle="h2" as="h2" color="primary.500" mb="1rem">
        {isMrfCutoverEnabled
          ? CUTOVER_SHORT_DESCRIPTION
          : t('shortDescription')}
      </Text>
      <Text textStyle="body-1" color="secondary.500" mb="2.5rem">
        {isMrfCutoverEnabled ? CUTOVER_LONG_DESCRIPTION : t('longDescription')}
        &nbsp;
        <Link isExternal href={paymentGuideLink}>
          {t('learnMore')}
        </Link>
      </Text>
      <SettingsUnsupportedSvgr />
    </Flex>
  )
}
