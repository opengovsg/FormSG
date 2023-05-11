import { Box } from '@chakra-ui/react'

import { PAYMENT_CONTACT_FIELD_ID } from '~shared/constants'
import {
  BasicField,
  EmailFieldBase,
  FormColorTheme,
  FormPaymentsField,
  FormPaymentsFieldV2,
} from '~shared/types'

import { EmailFieldInput } from '~templates/Field/Email'
import { useSectionColor } from '~templates/Field/Section/SectionField'

import { VerifiableFieldBuilderContainer } from '~features/admin-form/create/builder-and-design/BuilderAndDesignContent/FieldRow/VerifiableFieldBuilderContainer'
import { getFieldCreationMeta } from '~features/admin-form/create/builder-and-design/utils/fieldCreation'
import { PaymentItemDetailsBlock } from '~features/public-form/components/FormPaymentPage/stripe/components/PaymentItemDetails'
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
      <Box as="h2" mb="1rem" textStyle="h2" color={sectionColor}>
        Payment
      </Box>
      <Box mb="2rem">
        <PaymentItemDetailsBlock
          paymentDetails={
            { ...paymentDetails, version: 2 } as FormPaymentsFieldV2
          }
          colorTheme={colorTheme}
        />
      </Box>
      <Box>
        <PaymentItemDetailsBlock
          paymentDetails={{ ...paymentDetails, version: 1 }}
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
