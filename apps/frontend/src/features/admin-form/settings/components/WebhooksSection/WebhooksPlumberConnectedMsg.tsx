import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text } from '@chakra-ui/react'

import { OGP_PLUMBER } from '~constants/links'
import Link from '~components/Link'

import { SettingsUnsupportedSvgr } from '~features/admin-form/settings/svgrs/SettingsUnsupportedSvgr'

export const WebhooksPlumberConnectedMsg = (): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Flex justify="center" flexDir="column" textAlign="center">
      <Text textStyle="h2" as="h2" color="primary.500" mb="1rem">
        {t('features.adminForm.settings.webhooks.plumberConnected.title')}
      </Text>
      <Text textStyle="body-1" color="secondary.500" mb="2.5rem">
        <Trans
          i18nKey="features.adminForm.settings.webhooks.plumberConnected.body"
          components={{
            plumberLink: <Link isExternal href={OGP_PLUMBER} />,
          }}
        />
      </Text>
      <SettingsUnsupportedSvgr />
    </Flex>
  )
}
