import { useEffect } from 'react'
import {
  BiCodeBlock,
  BiCog,
  BiDollar,
  BiKey,
  BiMailSend,
  BiMessage,
} from 'react-icons/bi'
import { IconType } from 'react-icons/lib'
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

import { FormResponseMode } from '~shared/types'

import { ADMINFORM_RESULTS_SUBROUTE, ADMINFORM_ROUTE } from '~constants/routes'
import { useDraggable } from '~hooks/useDraggable'

import { useUser } from '~features/user/queries'

import { useAdminFormCollaborators } from '../common/queries'

import { SettingsTab } from './components/SettingsTab'
import { useAdminFormSettings } from './queries'
import { SettingsAuthPage } from './SettingsAuthPage'
import { SettingsEmailsPage } from './SettingsEmailsPage'
import { SettingsGeneralPage } from './SettingsGeneralPage'
import { SettingsPaymentsPage } from './SettingsPaymentsPage'
import { SettingsTwilioPage } from './SettingsTwilioPage'
import { SettingsWebhooksPage } from './SettingsWebhooksPage'

interface TabEntry {
  label: string
  icon: IconType
  component: () => JSX.Element
  path: string
  showRedDot?: boolean
}

export const SettingsPage = (): JSX.Element => {
  const { formId, settingsTab } = useParams()
  const { data: formSettings, isLoading: isFormSettingLoading } =
    useAdminFormSettings()
  const { user, isLoading: isUserLoading } = useUser()

  if (!formId) throw new Error('No formId provided')

  const { hasEditAccess, isLoading: isCollabLoading } =
    useAdminFormCollaborators(formId)
  const navigate = useNavigate()

  // Redirect view-only collaborators to results screen.
  useEffect(() => {
    if (!isCollabLoading && !hasEditAccess)
      navigate(`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_RESULTS_SUBROUTE}`)
  }, [formId, hasEditAccess, isCollabLoading, navigate])

  // TODO: (MRF-email-notif) Remove isTest when email notifications is out of beta
  const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'
  // For beta flagging email notifications tab.
  const emailNotificationsTab =
    isUserLoading ||
    isFormSettingLoading ||
    // TODO: (MRF-email-notif) Remove isTest and betaFlag check when MRF email notifications is out of beta
    (!isTest &&
      formSettings?.responseMode === FormResponseMode.Multirespondent &&
      !user?.betaFlags?.mrfEmailNotifications)
      ? null
      : {
          label: 'Email notifications',
          icon: BiMailSend,
          component: SettingsEmailsPage,
          path: 'email-notifications',
          showRedDot: true,
        }

  const tabConfig: TabEntry[] = [
    {
      label: 'General',
      icon: BiCog,
      component: SettingsGeneralPage,
      path: 'general',
    },
    {
      label: 'Singpass',
      icon: BiKey,
      component: SettingsAuthPage,
      path: 'singpass',
    },
    emailNotificationsTab,
    {
      label: 'Twilio credentials',
      icon: BiMessage,
      component: SettingsTwilioPage,
      path: 'twilio-credentials',
    },
    {
      label: 'Webhooks',
      icon: BiCodeBlock,
      component: SettingsWebhooksPage,
      path: 'webhooks',
    },
    {
      label: 'Payments',
      icon: BiDollar,
      component: SettingsPaymentsPage,
      path: 'payments',
    },
  ].filter(Boolean) as TabEntry[]

  const { ref, onMouseDown } = useDraggable<HTMLDivElement>()

  const tabIndex = tabConfig.findIndex(
    (tab) => tab.path === (settingsTab ?? 'general').toLowerCase(),
  )

  const handleTabChange = (index: number) => {
    navigate(`${ADMINFORM_ROUTE}/${formId}/settings/${tabConfig[index].path}`)
  }

  return (
    <Box
      overflow="auto"
      /**
       * HACK: Chromium browsers have a bug where sibling elements with `position: sticky` will not
       * be correctly calculated during a reflow. This causes the sibling to not have the correct
       * y-axis position.
       *
       * Setting the `position` to `sticky` or `relative` would workaround this issue. We're choosing
       * not to use `sticky` since it has more side effects and gotchas.
       */
      position="relative"
      flex={1}
    >
      <Tabs
        isLazy
        isManual
        orientation="vertical"
        variant="line"
        py={{ base: '2.5rem', lg: '3.125rem' }}
        px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
        index={tabIndex === -1 ? 0 : tabIndex}
        onChange={(index) => {
          handleTabChange(index)
        }}
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
              <SettingsTab
                key={tab.label}
                label={tab.label}
                icon={tab.icon}
                showNewBadge={tab.showRedDot}
              />
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
