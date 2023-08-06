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
  PaymentItemDetailsBlock,
  VariablePaymentItemDetailsField,
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

export const PaymentPreview = ({
  colorTheme = FormColorTheme.Blue,
  paymentDetails,
  isBuilder,
}: PaymentPreviewProps) => {
  const sectionColor = useSectionColor(colorTheme)
  const emailFieldSchema: VerifiableEmailFieldSchema = {
    ...(getFieldCreationMeta(BasicField.Email) as EmailFieldBase),
    title: 'Email Address',
    _id: PAYMENT_CONTACT_FIELD_ID,
    description: 'Proof of payment will be sent to this email',
    isVerifiable: true,
  }

  return (
    <>
      <Box as="h2" mb="2.25rem" textStyle="h2" color={sectionColor}>
        Payment
      </Box>
      <Box mb="2rem">
        {paymentDetails.payment_type === PaymentType.Variable ? (
          <VariablePaymentItemDetailsField
            paymentItemName={paymentDetails.name}
            colorTheme={colorTheme}
            paymentDescription={paymentDetails.description}
            paymentMin={paymentDetails.min_amount}
            paymentMax={paymentDetails.max_amount}
          />
        ) : (
          <PaymentItemDetailsBlock
            paymentItemName={paymentDetails.name}
            colorTheme={colorTheme}
            paymentAmount={paymentDetails.amount_cents}
            paymentDescription={paymentDetails.description}
          />
        )}
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
