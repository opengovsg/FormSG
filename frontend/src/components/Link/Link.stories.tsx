import { BiRightArrowAlt } from 'react-icons/bi'
import Icon from '@chakra-ui/icon'
import { SimpleGrid, Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { Link, LinkProps } from './Link'

export default {
  title: 'Components/Link',
  component: Link,
  decorators: [],
} as Meta

const Template: Story<LinkProps> = (args) => <Link {...args} />
export const Default = Template.bind({})
Default.args = {
  children: 'Link',
  href: '',
}

export const Disabled = Template.bind({})
Disabled.args = {
  isDisabled: true,
  children: 'Disabled link',
  href: '',
}

export const WithExternalIcon = Template.bind({})
WithExternalIcon.args = {
  children: "This goes to Form's homepage",
  href: 'https://form.gov.sg',
  isExternal: true,
}

export const VariantInline = Template.bind({})
VariantInline.args = {
  variant: 'inline',
  children: 'Inline variant link',
  isExternal: false,
  href: '',
}

export const VariantStandalone = Template.bind({})
VariantStandalone.args = {
  variant: 'standalone',
  children: (
    <>
      Standalone variant link
      <Icon as={BiRightArrowAlt} fontSize="1.5rem" ml="0.5rem" />
    </>
  ),
  isExternal: false,
  href: '',
}

const TemplateGroup: Story<LinkProps> = (args) => (
  <SimpleGrid
    columns={2}
    spacing={8}
    templateColumns="max-content max-content"
    alignItems="center"
  >
    <Text>primary</Text>
    <Link {...args} colorScheme="primary" />
    <Text>secondary</Text>
    <Link {...args} colorScheme="secondary" />
    <Text>danger</Text>
    <Link {...args} colorScheme="danger" />
    <Text>warning</Text>
    <Link {...args} colorScheme="warning" />
    <Text>success</Text>
    <Link {...args} colorScheme="success" />
    <Text>neutral</Text>
    <Link {...args} colorScheme="neutral" />
    <Text>primary</Text>
    <Link {...args} colorScheme="primary" />
    <Text>theme-green</Text>
    <Link {...args} colorScheme="theme-green" />
    <Text>theme-teal</Text>
    <Link {...args} colorScheme="theme-teal" />
    <Text>theme-purple</Text>
    <Link {...args} colorScheme="theme-purple" />
    <Text>theme-grey</Text>
    <Link {...args} colorScheme="theme-grey" />
    <Text>theme-yellow</Text>
    <Link {...args} colorScheme="theme-yellow" />
    <Text>theme-orange</Text>
    <Link {...args} colorScheme="theme-orange" />
    <Text>theme-red</Text>
    <Link {...args} colorScheme="theme-red" />
    <Text>theme-brown</Text>
    <Link {...args} colorScheme="theme-brown" />
  </SimpleGrid>
)

export const VariantInlineColorSchemes = TemplateGroup.bind({})
VariantInlineColorSchemes.args = {
  children: 'Link with colours',
  variant: 'inline',
  href: '',
}

export const VariantStandaloneColorSchemes = TemplateGroup.bind({})
VariantStandaloneColorSchemes.args = {
  children: 'Link with colours',
  variant: 'standalone',
  href: '',
}
