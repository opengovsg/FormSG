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
import { SettingsGeneralPage } from './SettingsGeneralPage'

export const SettingsPage = (): JSX.Element => {
  const tabOrientation: UseTabsProps['orientation'] = useBreakpointValue({
    base: 'horizontal',
    xs: 'horizontal',
    md: 'vertical',
  })

  const { ref, onMouseDown } = useDraggable<HTMLDivElement>()

  return (
    <Tabs isLazy isManual orientation={tabOrientation} variant="line">
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
        top={{ base: 'initial', md: 0 }}
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
          <SettingsTab label="Thank you page" icon={BiCheckDouble} />
          <SettingsTab label="Email notifications" icon={BiMailSend} />
          <SettingsTab label="Webhooks" icon={BiCodeBlock} />
          <SettingsTab label="Workflow" icon={BiRocket} />
        </TabList>
      </Flex>
      <TabPanels maxW="42.5rem" mb={{ base: '4rem', md: 'initial' }}>
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
      <Spacer />
    </Tabs>
  )
}
