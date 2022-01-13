import { useDisclosure } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { viewports } from '~utils/storybook'

import {
  GovtMasthead as GovtMastheadComponent,
  GovtMastheadProps,
} from './GovtMasthead'

export default {
  title: 'Components/GovtMasthead',
  component: GovtMastheadComponent,
  decorators: [],
} as Meta

export const Mobile: Story<GovtMastheadProps> = (args) => {
  const props = useDisclosure({ ...args })
  const isMobile = true
  return <GovtMastheadComponent isMobile={isMobile} {...props} />
}
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const MobileExpanded: Story<GovtMastheadProps> = (args) => {
  const props = useDisclosure({ defaultIsOpen: true })
  const isMobile = true
  return <GovtMastheadComponent isMobile={isMobile} {...props} />
}
MobileExpanded.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}
MobileExpanded.storyName = 'Mobile/Expanded'

export const MobileCollapsed: Story<GovtMastheadProps> = (args) => {
  const props = useDisclosure({ defaultIsOpen: false })
  const isMobile = true
  return <GovtMastheadComponent isMobile={isMobile} {...props} />
}
MobileCollapsed.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}
MobileCollapsed.storyName = 'Mobile/Collapsed'

export const Desktop: Story<GovtMastheadProps> = (args) => {
  const props = useDisclosure({ ...args })
  const isMobile = false
  return <GovtMastheadComponent isMobile={isMobile} {...props} />
}

export const DesktopExpanded: Story<GovtMastheadProps> = (args) => {
  const props = useDisclosure({ defaultIsOpen: true })
  const isMobile = true
  return <GovtMastheadComponent isMobile={isMobile} {...props} />
}
DesktopExpanded.storyName = 'Desktop/Expanded'

export const DesktopCollapsed: Story<GovtMastheadProps> = (args) => {
  const props = useDisclosure({ defaultIsOpen: false })
  const isMobile = true
  return <GovtMastheadComponent isMobile={isMobile} {...props} />
}
DesktopCollapsed.storyName = 'Desktop/Collapsed'
