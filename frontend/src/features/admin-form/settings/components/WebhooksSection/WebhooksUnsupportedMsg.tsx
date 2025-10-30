import { useTranslation } from 'react-i18next'
import { Flex, Text } from '@chakra-ui/react'

import { GUIDE_WEBHOOKS } from '~constants/links'
import Link from '~components/Link'

import { SettingsUnsupportedSvgr } from '~features/admin-form/settings/svgrs/SettingsUnsupportedSvgr'

export const WebhooksUnsupportedMsg = (): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.webhooks',
  })

  return (
    <Flex justify="center" flexDir="column" textAlign="center">
      <Text textStyle="h2" as="h2" color="primary.500" mb="1rem">
        {t('unsupportedMessage.title')}
      </Text>
      <Text textStyle="body-1" color="secondary.500" mb="2.5rem">
        {t('unsupportedMessage.description')}{' '}
        <Link isExternal href={GUIDE_WEBHOOKS}>
          {t('unsupportedMessage.learnMore')}
        </Link>
      </Text>
      <SettingsUnsupportedSvgr />
    </Flex>
  )
}
