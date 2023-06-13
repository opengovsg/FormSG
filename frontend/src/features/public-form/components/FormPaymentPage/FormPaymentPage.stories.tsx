import React from 'react'
import { Meta, Story } from '@storybook/react'

import { FormColorTheme } from '~shared/types'

import { envHandlers } from '~/mocks/msw/handlers/env'
import {
  getPaymentInfoResponse,
  getPaymentReceiptStatusResponse,
} from '~/mocks/msw/handlers/payment'
import { getPublicFormResponse } from '~/mocks/msw/handlers/public-form'

import { StoryRouter } from '~utils/storybook'

import { PublicFormProvider } from '~features/public-form/PublicFormProvider'

import { GenericMessageBlock as GenericMessageBlockComponent } from './stripe/components'
import { StripeReceiptContainer } from './stripe/StripeReceiptContainer'
import {
  CreatePaymentIntentFailureBlock,
  PaymentItemDetailsBlock,
  PaymentStack,
} from './components'
import { FormPaymentPage } from './FormPaymentPage'

const DEFAULT_MSW_HANDLERS = [
  ...envHandlers,
  getPublicFormResponse(),
  getPaymentInfoResponse(),
]

export default {
  title: 'Pages/PublicFormPage/FormPaymentPage',
  component: FormPaymentPage,
  decorators: [
    StoryRouter({
      initialEntries: [
        `/61540ece3d4a6e50ac0cc6ff/payment/61540ece3d4a6e50ac0cc700`,
      ],
      path: '/:formId/payment/:paymentId',
    }),
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
    msw: DEFAULT_MSW_HANDLERS,
  },
} as Meta

const Template: (children: React.ReactElement) => Story = (children) => () =>
  (
    <PublicFormProvider formId="61540ece3d4a6e50ac0cc6ff">
      <PaymentStack>{children}</PaymentStack>
    </PublicFormProvider>
  )

export const PendingPaymentDetails = Template(
  <PaymentItemDetailsBlock
    paymentItemName="Mock event registration"
    paymentAmount={1000}
    colorTheme={FormColorTheme.Blue}
  />,
).bind({})

export const PaymentFailure = Template(
  <CreatePaymentIntentFailureBlock submissionId="MOCK_SUBMISSION_ID" />,
).bind({})

export const GenericMessage = Template(
  <GenericMessageBlockComponent
    submissionId="MOCK_SUBMISSION_ID"
    title="This is an example title"
    subtitle="This is a subtitle. Read me here."
  />,
).bind({})

export const CompleteWithoutReceipt = Template(
  <StripeReceiptContainer
    formId="61540ece3d4a6e50ac0cc6ff"
    submissionId="MOCK_SUBMISSION_ID"
    paymentId="MOCK_PAYMENT_ID"
  />,
).bind({})
CompleteWithoutReceipt.parameters = {
  msw: [
    ...DEFAULT_MSW_HANDLERS,
    getPaymentReceiptStatusResponse({ delay: 'infinite' }),
  ],
}

export const CompleteWithReceipt = Template(
  <StripeReceiptContainer
    formId="61540ece3d4a6e50ac0cc6ff"
    submissionId="MOCK_SUBMISSION_ID"
    paymentId="MOCK_PAYMENT_ID"
  />,
).bind({})
CompleteWithReceipt.parameters = {
  msw: [...DEFAULT_MSW_HANDLERS, getPaymentReceiptStatusResponse()],
}
