import { SimpleGrid, Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import {
  DropdownMenuSize,
  DropdownMenuVariant,
} from '../../theme/components/DropdownMenu'

import {
  DropdownMenu,
  DropdownMenuButton,
  DropdownMenuItem,
  DropdownMenuList,
} from './DropdownMenu'

export default {
  title: 'Components/DropdownMenu',
  component: DropdownMenu,
  argTypes: {
    variant: {
      options: ['outline', 'clear'],
      control: { type: 'radio' },
    },
    size: {
      options: ['normal', 'stretch'],
      control: { type: 'radio' },
    },
  },
} as Meta

type DropdownMenuTemplateProps = {
  variant: DropdownMenuVariant
  size: DropdownMenuSize
  children: string
  isOpen?: boolean
}

type DropdownMenuGroupTemplateProps = {
  variant: DropdownMenuVariant
}

const DropdownMenuTemplate: Story<DropdownMenuTemplateProps> = ({
  variant,
  size,
  children,
  isOpen,
}) => {
  return (
    <DropdownMenu {...(isOpen ? { isOpen } : {})}>
      {({ isOpen }) => (
        <>
          <DropdownMenuButton isActive={isOpen} variant={variant} size={size}>
            {children}
          </DropdownMenuButton>
          <DropdownMenuList>
            <DropdownMenuItem>Last updated</DropdownMenuItem>
            <DropdownMenuItem>Date created</DropdownMenuItem>
            <DropdownMenuItem>Name</DropdownMenuItem>
          </DropdownMenuList>
        </>
      )}
    </DropdownMenu>
  )
}

const DropdownMenuGroupTemplate: Story<DropdownMenuGroupTemplateProps> = ({
  variant,
}) => {
  return (
    <SimpleGrid
      columns={2}
      spacing={8}
      templateColumns="max-content auto"
      alignItems="center"
    >
      <Text>Closed Menu</Text>
      <SimpleGrid
        columns={2}
        spacing={8}
        templateColumns="min-content auto"
        alignItems="center"
      >
        <DropdownMenuTemplate variant={variant} size={'normal'}>
          Menu
        </DropdownMenuTemplate>
        <DropdownMenuTemplate variant={variant} size={'stretch'}>
          Menu Stretch
        </DropdownMenuTemplate>
      </SimpleGrid>
      <Text>Open Menu</Text>
      <SimpleGrid
        columns={2}
        spacing={8}
        templateColumns="min-content auto"
        alignItems="center"
      >
        <DropdownMenuTemplate variant={variant} size={'normal'} isOpen>
          Menu
        </DropdownMenuTemplate>
        <DropdownMenuTemplate variant={variant} size={'stretch'} isOpen>
          Menu Stretch
        </DropdownMenuTemplate>
      </SimpleGrid>
    </SimpleGrid>
  )
}

export const Default = DropdownMenuTemplate.bind({})
Default.args = {
  variant: 'outline',
  size: 'normal',
  children: 'Menu Default',
}

export const Outline = DropdownMenuGroupTemplate.bind({})
Outline.args = { variant: 'outline' }

export const Clear = DropdownMenuGroupTemplate.bind({})
Clear.args = { variant: 'clear' }
