import { Meta, Story } from '@storybook/react'

import {
  getBillingInfo,
  getEmptyBillingInfo,
} from '~/mocks/msw/handlers/billing'

import { BILLING_ROUTE } from '~constants/routes'
import { StoryRouter, viewports } from '~utils/storybook'

import { BillingPage } from './BillingPage'

export default {
  title: 'Pages/BillingPage',
  component: BillingPage,
  decorators: [
    StoryRouter({
      initialEntries: [BILLING_ROUTE],
      path: BILLING_ROUTE,
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    chromatic: { delay: 200 },
  },
} as Meta

const Template: Story = () => <BillingPage />

export const DesktopNoCharges = Template.bind({})
DesktopNoCharges.parameters = {
  msw: [getEmptyBillingInfo()],
}
export const TabletNoCharges = Template.bind({})
TabletNoCharges.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
  msw: [getEmptyBillingInfo()],
}

export const MobileNoCharges = Template.bind({})
MobileNoCharges.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
  msw: [getEmptyBillingInfo()],
}

export const DesktopHasCharges = Template.bind({})
DesktopHasCharges.parameters = {
  msw: [getBillingInfo({ delay: 1000 })],
}

export const TabletHasCharges = Template.bind({})
TabletHasCharges.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
  msw: [getBillingInfo({ delay: 1000 })],
}

export const MobileHasCharges = Template.bind({})
MobileHasCharges.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
  msw: [getBillingInfo({ delay: 1000 })],
}

export const DesktopLoading = Template.bind({})
DesktopLoading.parameters = {
  msw: [getBillingInfo({ delay: 'infinite' })],
}

export const TabletLoading = Template.bind({})
TabletLoading.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
  msw: [getBillingInfo({ delay: 'infinite' })],
}

export const MobileLoading = Template.bind({})
MobileLoading.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
  msw: [getBillingInfo({ delay: 'infinite' })],
}
