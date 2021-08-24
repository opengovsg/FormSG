import { TabPanel, TabPanels, Tabs, TabsProps } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { viewports } from '~utils/storybook'

import { Tab } from './Tab'
import { TabList } from './TabList'

export default {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    backgrounds: {
      default: 'tabs-light',
      values: [
        // secondary.100
        { name: 'tabs-light', value: '#F5F6F8' },
      ],
    },
  },
} as Meta

const TabTemplate: Story<TabsProps> = (args) => {
  const contentFontColour = args.variant === 'line-light' ? 'black' : 'white'

  return (
    <Tabs {...args}>
      <TabList>
        <Tab>Create</Tab>
        <Tab>Settings</Tab>
        <Tab>Results</Tab>
      </TabList>
      <TabPanels>
        <TabPanel color={contentFontColour}>Create tab content</TabPanel>
        <TabPanel color={contentFontColour}>Settings tab content</TabPanel>
        <TabPanel color={contentFontColour}>Results tab content</TabPanel>
      </TabPanels>
    </Tabs>
  )
}

export const LightTab = TabTemplate.bind({})
LightTab.args = {
  variant: 'line-light',
}

export const DarkTab = TabTemplate.bind({})
DarkTab.args = {
  variant: 'line-dark',
}

export const WithScrollingLight = TabTemplate.bind({})
WithScrollingLight.args = {
  variant: 'line-light',
}
WithScrollingLight.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const WithScrollingDark = TabTemplate.bind({})
WithScrollingDark.args = {
  variant: 'line-dark',
}
WithScrollingDark.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}
