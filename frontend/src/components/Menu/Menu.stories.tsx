import {
  Box,
  SimpleGrid,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  ThemingProps,
  Tr,
} from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { Menu, MenuButtonProps } from './Menu'

export default {
  title: 'Components/Menu',
  component: Menu,
  tags: ['autodocs'],
  parameters: { docs: { source: { type: 'code' } } },
} as Meta

type MenuTemplateProps = MenuButtonProps & {
  size?: ThemingProps<'Menu'>['size']
}
type MenuGroupTemplateProps = {
  variant: ThemingProps<'Menu'>['variant']
  size?: ThemingProps<'Menu'>['size']
}

const MenuTemplate: StoryFn<MenuTemplateProps> = ({
  variant,
  children,
  isStretch,
  size,
  isOpen,
}) => {
  return (
    <Menu size={size} isStretch={isStretch} isOpen={isOpen}>
      {({ isOpen }) => (
        <>
          <Menu.Button
            size={size}
            variant={variant}
            isStretch={isStretch}
            isOpen={isOpen}
          >
            {children}
          </Menu.Button>
          <Menu.List>
            <Menu.Item>Last updated</Menu.Item>
            <Menu.Item isDisabled>Date created</Menu.Item>
            <Menu.Item>Name</Menu.Item>
          </Menu.List>
        </>
      )}
    </Menu>
  )
}

const MenuGroupTemplate: StoryFn<MenuGroupTemplateProps> = (props) => {
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
        <MenuTemplate {...props}>Menu</MenuTemplate>
        <MenuTemplate {...props} isStretch>
          Menu Stretch
        </MenuTemplate>
      </SimpleGrid>
      <Text>Open Menu</Text>
      <SimpleGrid
        columns={2}
        spacing={8}
        templateColumns="inherit"
        alignItems="center"
      >
        <MenuTemplate {...props} isOpen>
          Menu
        </MenuTemplate>
        <MenuTemplate {...props} isStretch isOpen>
          Menu Stretch
        </MenuTemplate>
      </SimpleGrid>
    </SimpleGrid>
  )
}
export const Default = MenuTemplate.bind({})
Default.args = {
  children: 'Menu Default',
  variant: 'outline',
  isStretch: false,
}

export const Outline = MenuGroupTemplate.bind({})
Outline.args = { variant: 'outline' }

export const Clear = MenuGroupTemplate.bind({})
Clear.args = { variant: 'clear' }

export const Playground: StoryFn = () => {
  return (
    <Box>
      <Menu>
        {({ isOpen }) => (
          <>
            <Menu.Button isOpen={isOpen}>EXPORT</Menu.Button>
            <Menu.List>
              <Menu.Item
                onClick={() => {
                  alert('Successfully downloaded')
                }}
              >
                CSV only
              </Menu.Item>
              <Menu.Item
                onClick={() => {
                  alert('Successfully downloaded')
                }}
              >
                CSV and Attachments
              </Menu.Item>
            </Menu.List>
          </>
        )}
      </Menu>
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
