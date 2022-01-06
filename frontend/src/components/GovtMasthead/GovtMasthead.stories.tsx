import { useDisclosure } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import {
  GovtMasthead as GovtMastheadComponent,
  GovtMastheadProps,
} from './GovtMasthead'

export default {
  title: 'Components/GovtMasthead',
  component: GovtMastheadComponent,
  decorators: [],
} as Meta

const Template: Story<GovtMastheadProps> = (args) => {
  const props = useDisclosure(args)
  return <GovtMastheadComponent {...props} />
}

export const GovtMastheadExpanded = Template.bind({})
GovtMastheadExpanded.args = { isOpen: true }

export const GovtMastheadCollapsed = Template.bind({})
GovtMastheadCollapsed.args = { isOpen: false }
