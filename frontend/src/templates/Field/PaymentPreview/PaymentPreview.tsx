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
import { useSectionColor } from '~templates/Field/Section/SectionField'

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
          colorTheme={colorTheme}
          paymentDescription={paymentDetails.description}
          paymentMin={paymentDetails.min_amount}
          paymentMax={paymentDetails.max_amount}
        />
      )
    }
    case PaymentType.Products: {
      return (
        <ProductPaymentItemDetailsBlock
          paymentDetails={paymentDetails}
          colorTheme={colorTheme}
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
    title: 'Email Address',
    _id: PAYMENT_CONTACT_FIELD_ID,
    description: 'Proof of payment will be sent to this email',
    isVerifiable: true,
  }
  const sectionColor = useSectionColor(colorTheme)

  const title =
    paymentDetails.payment_type === PaymentType.Products
      ? paymentDetails.description
      : 'Payment'
  return (
    <>
      <Box as="h2" mb="1rem" textStyle="h2" color={sectionColor}>
        {title}
      </Box>
      <Box mb="2rem">
        <PaymentItemDetailsElement
          paymentDetails={paymentDetails}
          colorTheme={colorTheme}
        />
      </Box>
      {isBuilder ? (
        <VerifiableFieldBuilderContainer schema={emailFieldSchema}>
          <EmailFieldInput schema={emailFieldSchema} />
        </VerifiableFieldBuilderContainer>
      ) : (
        <VerifiableEmailField schema={emailFieldSchema} />
      )}
    </>
  )
}
