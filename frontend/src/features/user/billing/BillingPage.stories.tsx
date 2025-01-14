import { Meta, StoryFn } from '@storybook/react'

import {
  getBillingInfo,
  getEmptyBillingInfo,
} from '~/mocks/msw/handlers/billing'

import { BILLING_ROUTE } from '~constants/routes'
import { mockDateDecorator, StoryRouter, viewports } from '~utils/storybook'

import { BillCharges, BillChargesProps } from './BillCharges'
import { BillingPage } from './BillingPage'

const MOCK_ESRVCID = 'MOCK_ESRVCID'
const MOCK_DATE_RANGE = { yr: 2022, mth: 5 }

export default {
  title: 'Pages/BillingPage',
  decorators: [
    StoryRouter({
      initialEntries: [BILLING_ROUTE],
      path: BILLING_ROUTE,
    }),
    mockDateDecorator,
  ],
  parameters: {
    layout: 'fullscreen',
    chromatic: { delay: 200 },
    mockdate: new Date('2024-10-07T19:52:00.000Z'),
  },
} as Meta

// BillingPage

const PageTemplate: StoryFn = () => <BillingPage />

export const DesktopDefault = PageTemplate.bind({})
DesktopDefault.parameters = {
  msw: [getEmptyBillingInfo()],
}
export const TabletDefault = PageTemplate.bind({})
TabletDefault.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
  msw: [getEmptyBillingInfo()],
}

export const MobileDefault = PageTemplate.bind({})
MobileDefault.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
  msw: [getEmptyBillingInfo()],
}

// BillCharges

const MOCK_BILLCHARGES_ARGS = {
  esrvcId: MOCK_ESRVCID,
  dateRange: MOCK_DATE_RANGE,
  todayDateRange: MOCK_DATE_RANGE,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDateRange: async () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onSubmitEsrvcId: async () => {},
}

export const DesktopNoCharges: StoryFn<BillChargesProps> = (args) => (
  <BillCharges {...args} />
)
DesktopNoCharges.args = MOCK_BILLCHARGES_ARGS
DesktopNoCharges.parameters = {
  msw: [getEmptyBillingInfo()],
}

export const TabletNoCharges: StoryFn<BillChargesProps> = (args) => (
  <BillCharges {...args} />
)
TabletNoCharges.args = MOCK_BILLCHARGES_ARGS
TabletNoCharges.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
  msw: [getEmptyBillingInfo()],
}

export const MobileNoCharges: StoryFn<BillChargesProps> = (args) => (
  <BillCharges {...args} />
)
MobileNoCharges.args = MOCK_BILLCHARGES_ARGS
MobileNoCharges.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
  msw: [getEmptyBillingInfo()],
}

export const DesktopHasCharges: StoryFn<BillChargesProps> = (args) => (
  <BillCharges {...args} />
)
DesktopHasCharges.args = MOCK_BILLCHARGES_ARGS
DesktopHasCharges.parameters = {
  msw: [getBillingInfo({ delay: 1000 })],
}

export const TabletHasCharges: StoryFn<BillChargesProps> = (args) => (
  <BillCharges {...args} />
)
TabletHasCharges.args = MOCK_BILLCHARGES_ARGS
TabletHasCharges.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
  msw: [getBillingInfo({ delay: 1000 })],
}

export const MobileHasCharges: StoryFn<BillChargesProps> = (args) => (
  <BillCharges {...args} />
)
MobileHasCharges.args = MOCK_BILLCHARGES_ARGS
MobileHasCharges.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
  msw: [getBillingInfo({ delay: 1000 })],
}

export const DesktopLoading: StoryFn<BillChargesProps> = (args) => (
  <BillCharges {...args} />
)
DesktopLoading.args = MOCK_BILLCHARGES_ARGS
DesktopLoading.parameters = {
  msw: [getBillingInfo({ delay: 'infinite' })],
}

export const TabletLoading: StoryFn<BillChargesProps> = (args) => (
  <BillCharges {...args} />
)
TabletLoading.args = MOCK_BILLCHARGES_ARGS
TabletLoading.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
  msw: [getBillingInfo({ delay: 'infinite' })],
}

export const MobileLoading: StoryFn<BillChargesProps> = (args) => (
  <BillCharges {...args} />
)
MobileLoading.args = MOCK_BILLCHARGES_ARGS
MobileLoading.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
  msw: [getBillingInfo({ delay: 'infinite' })],
}
