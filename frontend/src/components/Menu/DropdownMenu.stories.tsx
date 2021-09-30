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
  DropdownMenu,
  DropdownMenuButton,
  DropdownMenuItem,
  DropdownMenuList,
} from './DropdownMenu'

export default {
  title: 'Components/DropdownMenu',
  component: DropdownMenu,
} as Meta

type DropdownMenuTemplateProps = {
  isClear?: boolean
  isStretch?: boolean
  children: string
  isOpen?: boolean
}

type DropdownMenuGroupTemplateProps = {
  isClear?: boolean
}

const DropdownMenuTemplate: Story<DropdownMenuTemplateProps> = ({
  isClear,
  isStretch,
  children,
  isOpen,
}) => {
  return (
    <DropdownMenu {...(isOpen ? { isOpen } : {})}>
      {({ isOpen }) => (
        <>
          <DropdownMenuButton
            isActive={isOpen}
            isClear={isClear}
            isStretch={isStretch}
          >
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
  isClear,
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
        <DropdownMenuTemplate isClear={isClear}>Menu</DropdownMenuTemplate>
        <DropdownMenuTemplate isClear={isClear} isStretch>
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
        <DropdownMenuTemplate isClear={isClear} isOpen>
          Menu
        </DropdownMenuTemplate>
        <DropdownMenuTemplate isClear={isClear} isStretch isOpen>
          Menu Stretch
        </DropdownMenuTemplate>
      </SimpleGrid>
    </SimpleGrid>
  )
}
export const Default = DropdownMenuTemplate.bind({})
Default.args = {
  children: 'Menu Default',
  isClear: false,
  isStretch: false,
}

export const Outline = DropdownMenuGroupTemplate.bind({})
Outline.args = {}

export const Clear = DropdownMenuGroupTemplate.bind({})
Clear.args = { isClear: true }
export const Playground: Story = () => {
  return (
    <Box>
      <DropdownMenu>
        {({ isOpen }) => (
          <>
            <DropdownMenuButton isActive={isOpen}>EXPORT</DropdownMenuButton>
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
