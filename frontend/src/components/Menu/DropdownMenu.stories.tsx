import {
  Box,
  SimpleGrid,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
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
        <DropdownMenuTemplate variant={variant} size={'md'}>
          Menu
        </DropdownMenuTemplate>
        <DropdownMenuTemplate variant={variant} size={'lg'}>
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
        <DropdownMenuTemplate variant={variant} size={'md'} isOpen>
          Menu
        </DropdownMenuTemplate>
        <DropdownMenuTemplate variant={variant} size={'lg'} isOpen>
          Menu Stretch
        </DropdownMenuTemplate>
      </SimpleGrid>
    </SimpleGrid>
  )
}
export const Default = DropdownMenuTemplate.bind({})
Default.args = {
  variant: 'outline',
  size: 'md',
  children: 'Menu Default',
}

export const Outline = DropdownMenuGroupTemplate.bind({})
Outline.args = { variant: 'outline' }

export const Clear = DropdownMenuGroupTemplate.bind({})
Clear.args = { variant: 'clear' }
export const Playground: Story = ({ variant, size }) => {
  return (
    <Box>
      <DropdownMenu>
        {({ isOpen }) => (
          <>
            <DropdownMenuButton isActive={isOpen} variant={variant} size={size}>
              EXPORT
            </DropdownMenuButton>
            <DropdownMenuList>
              <DropdownMenuItem
                onClick={() => {
                  alert('Successfully downloaded')
                }}
              >
                CSV only
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  alert('Successfully downloaded')
                }}
              >
                CSV and Attachments
              </DropdownMenuItem>
            </DropdownMenuList>
          </>
        )}
      </DropdownMenu>
      <Table variant="simple" width="80%" mt="20px">
        <Thead bgColor="#444">
          <Tr>
            <Th textColor="white">#</Th>
            <Th textColor="white">Response ID</Th>
            <Th textColor="white">Time</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>3</Td>
            <Td>611339e30519320012b24a4d</Td>
            <Td>11th Aug 2021, 10:45:55 am</Td>
          </Tr>

          <Tr>
            <Td>2</Td>
            <Td>611335959eba44001239c086</Td>
            <Td>11th Aug 2021, 10:27:33 am</Td>
          </Tr>
          <Tr>
            <Td>1</Td>
            <Td>611335921795eb0012def447</Td>
            <Td>11th Aug 2021, 10:27:30 am</Td>
          </Tr>
        </Tbody>
      </Table>
    </Box>
  )
}

DropdownMenuTemplate.args = {
  variant: 'outline',
  size: 'md',
}
