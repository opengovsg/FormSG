import { useTranslation } from 'react-i18next'
import { Divider, Skeleton } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import {
  featureFlags,
  PLUMBER_WEBHOOK_URL_REGEX,
} from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types/form'

import { PlumberTile } from '~features/admin-form/create/integration/CreatePageIntegrationTab'

import { CategoryHeader } from './components/CategoryHeader'
import { EmailJsonToggle } from './components/EmailJsonToggle'
import { WebhooksSection } from './components/WebhooksSection'
import { WebhooksErrorMsg } from './components/WebhooksSection/WebhooksErrorMsg'
import { WebhooksPlumberConnectedMsg } from './components/WebhooksSection/WebhooksPlumberConnectedMsg'
import { WebhooksUnsupportedMsg } from './components/WebhooksSection/WebhooksUnsupportedMsg'
import { useIntegrationsFlags } from './hooks/useIntegrationsFlags'
import { useAdminFormSettings } from './queries'

export const SettingsWebhooksPage = (): JSX.Element => {
  const { t } = useTranslation()
  const {
    data: settings,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useAdminFormSettings()

  const enableMrfWebhooks = useFeatureIsOn(featureFlags.enableMrfWebhooks)
  const { isPlumberInSettings, isEmailJsonToggleOn, isIntegrationsTab } =
    useIntegrationsFlags()

  if (isError) {
    return <WebhooksErrorMsg onRetry={refetch} isRetrying={isRefetching} />
  }

  const enableWebhooks =
    !isLoading &&
    (settings?.responseMode === FormResponseMode.Encrypt ||
      (settings?.responseMode === FormResponseMode.Multirespondent &&
        enableMrfWebhooks))

  const isPlumberConnected = PLUMBER_WEBHOOK_URL_REGEX.test(
    settings?.webhook.url ?? '',
  )
  // Plumber and the JSON toggle show whatever state the webhooks part is in,
  // except on email mode forms, which can no longer take submissions
  const showOtherIntegrations =
    settings?.responseMode !== FormResponseMode.Email
  const otherIntegrations = showOtherIntegrations ? (
    <>
      {isPlumberInSettings ? (
        // Hover, press and focus follow the design system's Tile
        <PlumberTile
          mt="2.5rem"
          target="_blank"
          rel="noopener noreferrer"
          hasArrow={false}
          _hover={{ bg: 'primary.100' }}
          _active={{ bg: 'primary.200' }}
          _focusVisible={{
            outline: 'none',
            boxShadow: '0 0 0 2px var(--chakra-colors-primary-500)',
          }}
        />
      ) : null}
      {isEmailJsonToggleOn ? (
        <>
          <Divider my="2.5rem" />
          <EmailJsonToggle />
        </>
      ) : null}
    </>
  ) : null

  // NOTE: only show this page when the enableWebhooks flag is off.
  if (isPlumberConnected && !enableWebhooks) {
    return (
      <Skeleton isLoaded={!isLoading}>
        <WebhooksPlumberConnectedMsg />
        {otherIntegrations}
      </Skeleton>
    )
  }

  // Webhooks are only supported in storage mode; show message if form response mode is not storage
  if (!enableWebhooks) {
    return (
      <Skeleton isLoaded={!isLoading}>
        <WebhooksUnsupportedMsg />
        {otherIntegrations}
      </Skeleton>
    )
  }

  return (
    <Skeleton isLoaded={!isLoading}>
      <CategoryHeader>
        {isIntegrationsTab
          ? t('features.adminForm.settings.webhooks.integrationsTitle')
          : t('features.adminForm.settings.webhooks.title')}
      </CategoryHeader>
      <WebhooksSection />
      {otherIntegrations}
    </Skeleton>
  )
}
