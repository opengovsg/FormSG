import { useEffect, useMemo } from 'react'
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

import { FormResponseMode, SeenFlags } from '~shared/types'
import { isNonEmpty } from '~shared/utils/isNonEmpty'

import { ADMINFORM_RESULTS_SUBROUTE, ADMINFORM_ROUTE } from '~constants/routes'
import { useDraggable } from '~hooks/useDraggable'

import { SeenFlagsMapVersion } from '~features/user/constants'
import { useUserMutations } from '~features/user/mutations'
import { useUser } from '~features/user/queries'
import { getShowFeatureFlagLastSeen } from '~features/user/utils'

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
  onClick?: () => void
}

export const SettingsPage = (): JSX.Element => {
  const { formId, settingsTab } = useParams()
  const { data: settings } = useAdminFormSettings()
  const { user, isLoading: isUserLoading } = useUser()
  const { updateLastSeenFlagMutation } = useUserMutations()
  const shouldShowSettingsEmailNotiReddot = useMemo(() => {
    if (isUserLoading || !user) return false
    return getShowFeatureFlagLastSeen(user, SeenFlags.SettingsEmailNotification)
  }, [isUserLoading, user])

  if (!formId) throw new Error('No formId provided')

  const { hasEditAccess, isLoading: isCollabLoading } =
    useAdminFormCollaborators(formId)
  const navigate = useNavigate()

  // Redirect view-only collaborators to results screen.
  useEffect(() => {
    if (!isCollabLoading && !hasEditAccess)
      navigate(`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_RESULTS_SUBROUTE}`)
  }, [formId, hasEditAccess, isCollabLoading, navigate])

  const tabConfig = useMemo(() => {
    const emailsNotificationsTab =
      settings?.responseMode === FormResponseMode.Encrypt ||
      settings?.responseMode === FormResponseMode.Email
        ? {
            label: 'Email notifications',
            icon: BiMailSend,
            component: SettingsEmailsPage,
            path: 'email-notifications',
            showRedDot: shouldShowSettingsEmailNotiReddot,
            onClick: () => {
              if (shouldShowSettingsEmailNotiReddot) {
                updateLastSeenFlagMutation.mutate({
                  flag: SeenFlags.SettingsEmailNotification,
                  version:
                    SeenFlagsMapVersion[SeenFlags.SettingsEmailNotification],
                })
              }
            },
          }
        : null

    const baseConfig: (TabEntry | null)[] = [
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
      emailsNotificationsTab,
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
    ]

    return baseConfig.filter(isNonEmpty)
  }, [
    settings?.responseMode,
    shouldShowSettingsEmailNotiReddot,
    updateLastSeenFlagMutation,
  ])

  const { ref, onMouseDown } = useDraggable<HTMLDivElement>()

  const tabIndex = tabConfig.findIndex(
    (tab) => tab.path === (settingsTab ?? 'general').toLowerCase(),
  )

  const handleTabChange = (index: number) => {
    navigate(`${ADMINFORM_ROUTE}/${formId}/settings/${tabConfig[index].path}`)
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
        onChange={(index) => {
          handleTabChange(index)
          tabConfig[index].onClick?.()
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
                showRedDot={tab.showRedDot}
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
