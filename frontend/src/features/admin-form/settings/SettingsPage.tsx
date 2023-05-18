import { useEffect } from 'react'
import { BiCodeBlock, BiCog, BiDollar, BiKey, BiMessage } from 'react-icons/bi'
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
import { SettingsAuthPage } from './SettingsAuthPage'
import { SettingsGeneralPage } from './SettingsGeneralPage'
import { SettingsPaymentsPage } from './SettingsPaymentsPage'
import { SettingsTwilioPage } from './SettingsTwilioPage'
import { SettingsWebhooksPage } from './SettingsWebhooksPage'

const settingsTabsOrder = [
  'general',
  'singpass',
  'twilio',
  'webhooks',
  'payments',
]

export const SettingsPage = (): JSX.Element => {
  const { formId, settingsTab = settingsTabsOrder[0] } = useParams()
  const { user } = useUser()
  const { data: flags } = useFeatureFlags()

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

  const tabIndex = settingsTabsOrder.indexOf(settingsTab)

  return (
    <Box overflow="auto" flex={1}>
      <Tabs
        isLazy
        isManual
        orientation="vertical"
        variant="line"
        py={{ base: '2.5rem', lg: '3.125rem' }}
        px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
        defaultIndex={tabIndex === -1 ? 0 : tabIndex}
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
            <SettingsTab label="General" icon={BiCog} />
            <SettingsTab label="Singpass" icon={BiKey} />
            <SettingsTab label="Twilio credentials" icon={BiMessage} />
            <SettingsTab label="Webhooks" icon={BiCodeBlock} />
            {displayPayments && (
              <SettingsTab label="Payments" icon={BiDollar} />
            )}
          </TabList>
        </Flex>
        <TabPanels
          maxW="42.5rem"
          // Offset start of tabpanel text from tablist.
          mt={{ md: '1rem' }}
        >
          <TabPanel>
            <SettingsGeneralPage />
          </TabPanel>
          <TabPanel>
            <SettingsAuthPage />
          </TabPanel>
          <TabPanel>
            <SettingsTwilioPage />
          </TabPanel>
          <TabPanel>
            <SettingsWebhooksPage />
          </TabPanel>
          {displayPayments && (
            <TabPanel>
              <SettingsPaymentsPage />
            </TabPanel>
          )}
        </TabPanels>
        <Spacer />
      </Tabs>
    </Box>
  )
}
