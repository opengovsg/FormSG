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

import { ThemeButtonVariant } from '~theme/components/Button'

import { DropdownMenu } from './DropdownMenu'

export default {
  title: 'Components/DropdownMenu',
  component: DropdownMenu,
} as Meta

type DropdownMenuTemplateProps = {
  isFullWidth?: boolean
  isOpen?: boolean
  variant: ThemeButtonVariant
  children: string
}

type DropdownMenuGroupTemplateProps = {
  variant: ThemeButtonVariant
}

const DropdownMenuTemplate: Story<DropdownMenuTemplateProps> = ({
  variant,
  children,
  isFullWidth,
  isOpen,
}) => {
  return (
    <DropdownMenu {...(isOpen ? { isOpen } : {})}>
      {({ isOpen }) => (
        <>
          <DropdownMenu.Button
            variant={variant}
            isFullWidth={isFullWidth}
            isActive={isOpen}
          >
            {children}
          </DropdownMenu.Button>
          <DropdownMenu.List>
            <DropdownMenu.Item>Last updated</DropdownMenu.Item>
            <DropdownMenu.Item>Date created</DropdownMenu.Item>
            <DropdownMenu.Item>Name</DropdownMenu.Item>
          </DropdownMenu.List>
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
        templateColumns="inherit"
        alignItems="center"
      >
        <DropdownMenuTemplate variant={variant}>Menu</DropdownMenuTemplate>
        <DropdownMenuTemplate variant={variant} isFullWidth>
          Menu Stretch
        </DropdownMenuTemplate>
      </SimpleGrid>
      <Text>Open Menu</Text>
      <SimpleGrid
        columns={2}
        spacing={8}
        templateColumns="inherit"
        alignItems="center"
      >
        <DropdownMenuTemplate variant={variant} isOpen>
          Menu
        </DropdownMenuTemplate>
        <DropdownMenuTemplate variant={variant} isFullWidth isOpen>
          Menu Stretch
        </DropdownMenuTemplate>
      </SimpleGrid>
    </SimpleGrid>
  )
}
export const Default = DropdownMenuTemplate.bind({})
Default.args = {
  children: 'Menu Default',
  variant: 'outline',
  isFullWidth: false,
}

export const Outline = DropdownMenuGroupTemplate.bind({})
Outline.args = { variant: 'outline' }

export const Clear = DropdownMenuGroupTemplate.bind({})
Clear.args = { variant: 'clear' }

export const Playground: Story = () => {
  return (
    <Box>
      <DropdownMenu>
        {({ isOpen }) => (
          <>
            <DropdownMenu.Button isActive={isOpen}>EXPORT</DropdownMenu.Button>
            <DropdownMenu.List>
              <DropdownMenu.Item
                onClick={() => {
                  alert('Successfully downloaded')
                }}
              >
                CSV only
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => {
                  alert('Successfully downloaded')
                }}
              >
                CSV and Attachments
              </DropdownMenu.Item>
            </DropdownMenu.List>
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
