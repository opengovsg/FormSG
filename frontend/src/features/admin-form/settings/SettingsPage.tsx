import { useEffect, useMemo } from 'react'
import {
  BiCodeBlock,
  BiCog,
  BiDollar,
  BiKey,
  BiMailSend,
  BiMessage,
} from 'react-icons/bi'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Flex,
  Spacer,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react'

import { featureFlags } from '~shared/constants'

import { ADMINFORM_RESULTS_SUBROUTE, ADMINFORM_ROUTE } from '~constants/routes'
import { useDraggable } from '~hooks/useDraggable'

import { useFeatureFlags } from '~features/feature-flags/queries'
import { useUser } from '~features/user/queries'

import { useAdminFormCollaborators } from '../common/queries'

import { SettingsTab } from './components/SettingsTab'
import { isEmailOrStorageMode, useAdminFormSettings } from './queries'
import { SettingsAuthPage } from './SettingsAuthPage'
import { SettingsEmailNotificationsPage } from './SettingsEmailNotificationsPage'
import { SettingsGeneralPage } from './SettingsGeneralPage'
import { SettingsPaymentsPage } from './SettingsPaymentsPage'
import { SettingsTwilioPage } from './SettingsTwilioPage'
import { SettingsWebhooksPage } from './SettingsWebhooksPage'

export const SettingsPage = (): JSX.Element => {
  const { formId, settingsTab } = useParams()
  const { user } = useUser()
  const { data: flags } = useFeatureFlags()
  const { data: settings } = useAdminFormSettings()

  if (!formId) throw new Error('No formId provided')

  const { hasEditAccess, isLoading: isCollabLoading } =
    useAdminFormCollaborators(formId)
  const navigate = useNavigate()

  // Redirect view-only collaborators to results screen.
  useEffect(() => {
    if (!isCollabLoading && !hasEditAccess)
      navigate(`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_RESULTS_SUBROUTE}`)
  }, [formId, hasEditAccess, isCollabLoading, navigate])

  const { ref, onMouseDown } = useDraggable<HTMLDivElement>()

  const displayPayments =
    user?.betaFlags?.payment || flags?.has(featureFlags.payment)
  const displayEmailNotificationPage =
    settings && isEmailOrStorageMode(settings)

  // Note: Admins are not redirected to /general on invalid settings tabs as we
  // don't want to do this prematurely before displayPayments can be determined.
  const tabConfig = useMemo(() => {
    const baseTabs = [
      { label: 'General', icon: BiCog, component: SettingsGeneralPage },
      { label: 'Singpass', icon: BiKey, component: SettingsAuthPage },
      {
        label: 'Twilio credentials',
        icon: BiMessage,
        component: SettingsTwilioPage,
      },
      { label: 'Webhooks', icon: BiCodeBlock, component: SettingsWebhooksPage },
    ]

    if (displayPayments) {
      baseTabs.push({
        label: 'Payments',
        icon: BiDollar,
        component: SettingsPaymentsPage,
      })
    }

    if (displayEmailNotificationPage && !displayPayments) {
      baseTabs.splice(2, 0, {
        label: 'Email Notifications',
        icon: BiMailSend,
        component: SettingsEmailNotificationsPage,
      })
    }

    return baseTabs
  }, [displayPayments, displayEmailNotificationPage])

  const tabIndex = tabConfig.findIndex(
    (tab) =>
      tab.label.toLowerCase() === (settingsTab ?? 'general').toLowerCase(),
  )

  const handleTabChange = (index: number) => {
    navigate(
      `${ADMINFORM_ROUTE}/${formId}/settings/${tabConfig[index].label.toLowerCase()}`,
    )
  }

  return (
    <Box overflow="auto" flex={1}>
      <Tabs
        isLazy
        isManual
        orientation="vertical"
        variant="line"
        py={{ base: '2.5rem', lg: '3.125rem' }}
        px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
        index={tabIndex === -1 ? 0 : tabIndex}
        onChange={handleTabChange}
      >
        <Flex
          h="max-content"
          flex={1}
          flexShrink={0}
          ref={ref}
          onMouseDown={onMouseDown}
          position="sticky"
          zIndex={0}
          top={{ base: '2.5rem', lg: '3.125rem' }}
          borderTopColor="neutral.300"
          w={{ base: 'auto', lg: '21rem' }}
          __css={{
            scrollbarWidth: 0,
            /* Scrollbar for Chrome, Safari, Opera and Microsoft Edge */
            '&::-webkit-scrollbar': {
              width: 0,
              height: 0,
            },
          }}
        >
          <TabList
            overflowX="initial"
            display="inline-flex"
            w="max-content"
            mr={{ base: '1.5rem', md: '4rem', lg: '2rem' }}
            mb="calc(0.5rem - 2px)"
          >
            {tabConfig.map((tab) => (
              <SettingsTab key={tab.label} label={tab.label} icon={tab.icon} />
            ))}
          </TabList>
        </Flex>
        <TabPanels
          maxW="42.5rem"
          // Offset start of tabpanel text from tablist.
          mt={{ md: '1rem' }}
        >
          {tabConfig.map((tab) => (
            <TabPanel key={tab.label}>
              <tab.component />
            </TabPanel>
          ))}
        </TabPanels>
        <Spacer />
      </Tabs>
    </Box>
  )
}
