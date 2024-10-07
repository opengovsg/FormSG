import { Box } from '@chakra-ui/react'

import { PAYMENT_CONTACT_FIELD_ID } from '~shared/constants'
import {
  BasicField,
  EmailFieldBase,
  FormColorTheme,
  FormPaymentsField,
  PaymentType,
} from '~shared/types'

import { EmailFieldInput } from '~templates/Field/Email'

import { VerifiableFieldBuilderContainer } from '~features/admin-form/create/builder-and-design/BuilderAndDesignContent/FieldRow/VerifiableFieldBuilderContainer'
import { getFieldCreationMeta } from '~features/admin-form/create/builder-and-design/utils/fieldCreation'
import {
  FixedPaymentItemDetailsBlock,
  ProductPaymentItemDetailsBlock,
  VariablePaymentItemDetailsBlock,
} from '~features/public-form/components/FormPaymentPage/components'
import {
  VerifiableEmailField,
  VerifiableEmailFieldSchema,
} from '~features/verifiable-fields/Email'

import { useSectionColor } from '../Section/useSectionColor'

import { PRODUCT_ITEM_PLACEHOLDER } from './constants'

type PaymentPreviewProps = {
  colorTheme?: FormColorTheme
  paymentDetails: FormPaymentsField
  isBuilder?: boolean
}

const PaymentItemDetailsElement = ({
  colorTheme = FormColorTheme.Blue,
  paymentDetails,
}: {
  colorTheme?: FormColorTheme
  paymentDetails: FormPaymentsField
}) => {
  switch (paymentDetails.payment_type) {
    case PaymentType.Variable: {
      return (
        <VariablePaymentItemDetailsBlock
          paymentItemName={paymentDetails.name}
          paymentDescription={paymentDetails.description}
          paymentMin={paymentDetails.min_amount}
          paymentMax={paymentDetails.max_amount}
          globalMinAmountOverride={paymentDetails.global_min_amount_override}
        />
      )
    }
    case PaymentType.Products: {
      return (
        <ProductPaymentItemDetailsBlock
          colorTheme={colorTheme}
          paymentDetails={paymentDetails}
        />
      )
    }
    case PaymentType.Fixed: // Fallthrough
    default: {
      return (
        <FixedPaymentItemDetailsBlock
          paymentItemName={paymentDetails.name}
          colorTheme={colorTheme}
          paymentAmount={paymentDetails.amount_cents}
          paymentDescription={paymentDetails.description}
        />
      )
    }
  }
}

export const PaymentPreview = ({
  colorTheme = FormColorTheme.Blue,
  paymentDetails,
  isBuilder,
}: PaymentPreviewProps) => {
  const emailFieldSchema: VerifiableEmailFieldSchema = {
    ...(getFieldCreationMeta(BasicField.Email) as EmailFieldBase),
    title: 'Email address',
    _id: PAYMENT_CONTACT_FIELD_ID,
    description: 'Proof of payment will be sent to this email',
    isVerifiable: true,
  }
  const sectionColor = useSectionColor(colorTheme)

  const title = 'Payment'
  const _paymentDetails =
    isBuilder && paymentDetails.products?.length === 0
      ? {
          ...paymentDetails,
          products: [PRODUCT_ITEM_PLACEHOLDER],
        }
      : paymentDetails
  return (
    <>
      <Box as="h2" mb="2.25rem" textStyle="h2" color={sectionColor}>
        {title}
      </Box>
      <Box mb="2rem">
        <PaymentItemDetailsElement
          paymentDetails={_paymentDetails}
          colorTheme={colorTheme}
        />
      </Box>
      {isBuilder ? (
        <VerifiableFieldBuilderContainer
          schema={emailFieldSchema}
          colorTheme={colorTheme}
        >
          <EmailFieldInput schema={emailFieldSchema} />
        </VerifiableFieldBuilderContainer>
      ) : (
        <VerifiableEmailField
          schema={emailFieldSchema}
          colorTheme={colorTheme}
        />
      )}
    </>
  )
}
