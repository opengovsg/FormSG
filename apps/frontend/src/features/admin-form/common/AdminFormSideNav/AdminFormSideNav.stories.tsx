import { BiCog, BiTable } from 'react-icons/bi'
import { Box, Stack } from '@chakra-ui/react'
import { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import {
  AdminFormSideNav,
  AdminFormSideNavItem,
  SideNavCollapseControl,
} from './AdminFormSideNav'

export default {
  title: 'Features/AdminForm/SideNav',
  component: AdminFormSideNavItem,
  parameters: { layout: 'centered' },
  args: { label: 'General', icon: <BiCog fontSize="1.5rem" /> },
} satisfies Meta<typeof AdminFormSideNavItem>

type Story = StoryObj<typeof AdminFormSideNavItem>
export const Default: Story = {}
export const Selected: Story = { args: { isActive: true } }
export const Hover: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole('button'))
  },
}
export const KeyboardFocus: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab()
    await expect(within(canvasElement).getByRole('button')).toHaveFocus()
  },
}
export const LongestLabels: Story = {
  render: () => (
    <Box h="20rem">
      <AdminFormSideNav>
        <Stack spacing="1rem">
          <AdminFormSideNavItem
            label="Responses"
            icon={<BiTable fontSize="1.5rem" />}
          />
          <AdminFormSideNavItem
            label="Multi-lang"
            icon={<BiCog fontSize="1.5rem" />}
          />
          <AdminFormSideNavItem
            label="Thank you"
            icon={<BiCog fontSize="1.5rem" />}
          />
        </Stack>
      </AdminFormSideNav>
    </Box>
  ),
}
export const ChartsWithBeta: Story = {
  args: {
    label: 'Charts',
    badgeText: 'Beta',
    icon: <BiTable fontSize="1.5rem" />,
    isActive: true,
  },
}

export const ShortScreen: Story = {
  render: () => (
    <Box h="20rem" display="flex" data-testid="side-nav-viewport">
      <AdminFormSideNav
        role="navigation"
        aria-label="Short screen navigation"
        footer={
          <SideNavCollapseControl
            isCollapsed={false}
            onClick={() => undefined}
          />
        }
      >
        <Stack spacing="1rem">
          {Array.from({ length: 8 }, (_, index) => (
            <AdminFormSideNavItem
              key={index}
              label={`Item ${index + 1}`}
              icon={<BiCog fontSize="1.5rem" />}
            />
          ))}
        </Stack>
      </AdminFormSideNav>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rail = canvas.getByTestId('side-nav-viewport').getBoundingClientRect()
    const collapse = canvas
      .getByRole('button', { name: 'Collapse sidebar' })
      .getBoundingClientRect()
    await expect(collapse.bottom).toBeLessThanOrEqual(rail.bottom)
    await expect(collapse.top).toBeGreaterThanOrEqual(rail.top)
  },
}
