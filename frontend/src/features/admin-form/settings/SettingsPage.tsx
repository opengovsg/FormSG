import {
  BiCheckDouble,
  BiCodeBlock,
  BiCog,
  BiKey,
  BiMailSend,
  BiRocket,
} from 'react-icons/bi'
import {
  Flex,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useBreakpointValue,
  UseTabsProps,
} from '@chakra-ui/react'

import { SettingsTab } from './components/SettingsTab'
import { SettingsGeneralPage } from './SettingsGeneralPage'

export const SettingsPage = (): JSX.Element => {
  const tabOrientation: UseTabsProps['orientation'] = useBreakpointValue({
    base: 'horizontal',
    xs: 'horizontal',
    md: 'vertical',
  })

  return (
    <Tabs
      isLazy
      isManual
      orientation={tabOrientation}
      variant="line"
      py={{ base: '2.5rem', lg: '3.125rem' }}
      px={{ base: '1.75rem', lg: '2rem' }}
      display="grid"
      gridTemplateAreas={{ base: `'content' 'tabs'`, md: `'tabs content'` }}
      gridTemplateRows="1fr auto"
      gridTemplateColumns="auto 1fr"
    >
      <Flex
        gridArea="tabs"
        flexShrink={0}
        position={{ base: 'fixed', md: 'sticky' }}
        zIndex={{ base: 'docked', md: 0 }}
        bg={{ base: 'neutral.100', md: 'inherit' }}
        top={{ base: 'initial', md: '8.75rem', lg: '7.125rem' }}
        bottom={{ base: 0, md: 'initial' }}
        left={{ base: 0, md: 'initial' }}
        borderTop={{ base: '1px solid', md: 'none' }}
        borderColor="neutral.300"
        w="100%"
      >
        <TabList
          mx={{ base: '1.5rem', md: 0 }}
          mb="0.5rem"
          h="max-content"
          maxW="100%"
          w={{ base: 'auto', lg: '21rem' }}
          mr={{ md: '4rem', lg: 'initial' }}
        >
          <SettingsTab label="General" icon={BiCog} />
          <SettingsTab label="Singpass" icon={BiKey} />
          <SettingsTab label="Thank you page" icon={BiCheckDouble} />
          <SettingsTab label="Email notifications" icon={BiMailSend} />
          <SettingsTab label="Webhooks" icon={BiCodeBlock} />
          <SettingsTab label="Workflow" icon={BiRocket} />
        </TabList>
      </Flex>
      <TabPanels
        maxW="42.5rem"
        gridArea="content"
        pb={{ base: '4rem', md: 'initial' }}
      >
        <TabPanel>
          <SettingsGeneralPage />
        </TabPanel>
        <TabPanel>
          <p>two!</p>
        </TabPanel>
        <TabPanel>
          <p>3!</p>
        </TabPanel>
        <TabPanel>
          <p>4!</p>
        </TabPanel>
        <TabPanel>
          <p>5!</p>
        </TabPanel>
        <TabPanel>
          <p>6!</p>
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}
