import { Tabs, TabsProps } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { viewports } from '~utils/storybook'

import { Tab } from './Tab'
import { TabList } from './TabList'

export default {
  title: 'Components/Tabs',
  component: Tabs,
} as Meta

const TabTemplate: Story<TabsProps> = (args) => {
  return (
    <Tabs {...args}>
      <TabList>
        <Tab>Create</Tab>
        <Tab>Settings</Tab>
        <Tab>Results</Tab>
      </TabList>
    </Tabs>
  )
}

export const LightTab = TabTemplate.bind({})
LightTab.args = {
  variant: 'line-light',
}
LightTab.parameters = {
  backgrounds: { default: 'light' },
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
  backgrounds: { default: 'light' },
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
