import { BiCodeBlock, BiCog, BiKey, BiMessage } from 'react-icons/bi'
import {
  Box,
  Flex,
  Spacer,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useBreakpointValue,
  UseTabsProps,
} from '@chakra-ui/react'

import { useDraggable } from '~hooks/useDraggable'

import { SettingsTab } from './components/SettingsTab'
import { SettingsAuthPage } from './SettingsAuthPage'
import { SettingsGeneralPage } from './SettingsGeneralPage'
import { SettingsTwilioPage } from './SettingsTwilioPage'
import { SettingsWebhooksPage } from './SettingsWebhooksPage'

export const SettingsPage = (): JSX.Element => {
  const tabOrientation: UseTabsProps['orientation'] = useBreakpointValue({
    base: 'horizontal',
    xs: 'horizontal',
    md: 'vertical',
  })

  const { ref, onMouseDown } = useDraggable<HTMLDivElement>()

  return (
    <Box
      overflow="auto"
      flex={1}
      // Buffer for bottom navbar in mobile breakpoints.
      mb={{ base: '4rem', md: 'initial' }}
    >
      <Tabs
        isLazy
        isManual
        orientation={tabOrientation}
        variant="line"
        py={{ base: '2.5rem', md: '3.5rem', lg: '4rem' }}
        px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
      >
        <Flex
          h="max-content"
          flex={1}
          flexShrink={0}
          ref={ref}
          onMouseDown={onMouseDown}
          overflowX={{ base: 'auto', md: 'initial' }}
          position={{ base: 'fixed', md: 'sticky' }}
          zIndex={{ base: 'docked', md: 0 }}
          bg={{ base: 'neutral.100', md: 'inherit' }}
          // Height align text with start of tab panel.
          mt={{ md: '-1rem', lg: '-0.875rem' }}
          top={{ base: 'initial', md: '2.5rem', lg: '3.125rem' }}
          bottom={{ base: 0, md: 'initial' }}
          left={{ base: 0, md: 'initial' }}
          borderTop={{ base: '1px solid', md: 'none' }}
          borderTopColor="neutral.300"
          w={{ base: '100vw', md: 'auto', lg: '21rem' }}
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
            ml={{ base: '1.5rem', md: 0 }}
            mr={{ base: '1.5rem', md: '4rem', lg: '2rem' }}
            mb="calc(0.5rem - 2px)"
          >
            <SettingsTab label="General" icon={BiCog} />
            <SettingsTab label="Singpass" icon={BiKey} />
            <SettingsTab label="Twilio credentials" icon={BiMessage} />
            <SettingsTab label="Webhooks" icon={BiCodeBlock} />
          </TabList>
        </Flex>
        <TabPanels maxW="42.5rem">
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
        </TabPanels>
        <Spacer />
      </Tabs>
    </Box>
  )
}

export default SettingsPage
