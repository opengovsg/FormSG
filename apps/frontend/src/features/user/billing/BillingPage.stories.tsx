import { Meta, StoryFn } from '@storybook/react-vite'

import {
  getBillingInfo,
  getEmptyBillingInfo,
} from '~/mocks/msw/handlers/billing'

import { BILLING_ROUTE } from '~constants/routes'
import { mockDateDecorator, StoryRouter, viewportModes } from '~utils/storybook'

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
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    mockdate: new Date('2024-10-07T19:52:00.000Z'),
  },
} as Meta

// BillingPage

const PageTemplate: StoryFn = () => <BillingPage />

export const DesktopDefault = PageTemplate.bind({})
DesktopDefault.parameters = {
  argos: { modes: viewportModes('tablet', 'mobile') },
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
  argos: { modes: viewportModes('tablet', 'mobile') },
  msw: [getEmptyBillingInfo()],
}

export const DesktopHasCharges: StoryFn<BillChargesProps> = (args) => (
  <BillCharges {...args} />
)
DesktopHasCharges.args = MOCK_BILLCHARGES_ARGS
DesktopHasCharges.parameters = {
  argos: { modes: viewportModes('tablet', 'mobile') },
  msw: [getBillingInfo({ delay: 1000 })],
}

export const DesktopLoading: StoryFn<BillChargesProps> = (args) => (
  <BillCharges {...args} />
)
DesktopLoading.args = MOCK_BILLCHARGES_ARGS
DesktopLoading.parameters = {
  argos: { modes: viewportModes('tablet', 'mobile') },
  msw: [getBillingInfo({ delay: 'infinite' })],
}
