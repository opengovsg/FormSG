import { useTranslation } from 'react-i18next'
import { Flex, Text } from '@chakra-ui/react'

import Link from '~components/Link'

import { SettingsUnsupportedSvgr } from '~features/admin-form/settings/svgrs/SettingsUnsupportedSvgr'

import { usePaymentGuideLink } from './queries'

export const PaymentsUnsupportedMsg = (): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.payments.paymentUnsupportedMsg',
  })
  const { data: paymentGuideLink } = usePaymentGuideLink()
  return (
    <Flex justify="center" flexDir="column" textAlign="center">
      <Text textStyle="h2" as="h2" color="primary.500" mb="1rem">
        {t('shortDescription')}
      </Text>
      <Text textStyle="body-1" color="secondary.500" mb="2.5rem">
        {t('longDescription')}&nbsp;
        <Link isExternal href={paymentGuideLink}>
          {t('learnMore')}
        </Link>
      </Text>
      <SettingsUnsupportedSvgr />
    </Flex>
  )
}
