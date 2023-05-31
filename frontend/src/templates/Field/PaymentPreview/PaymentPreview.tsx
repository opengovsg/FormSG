import { Box } from '@chakra-ui/react'

import { PAYMENT_CONTACT_FIELD_ID } from '~shared/constants'
import {
  BasicField,
  EmailFieldBase,
  FormColorTheme,
  FormPaymentsField,
  FormPaymentsFieldV1,
  FormPaymentsFieldV2,
} from '~shared/types'

import { EmailFieldInput } from '~templates/Field/Email'
import { useSectionColor } from '~templates/Field/Section/SectionField'

import { VerifiableFieldBuilderContainer } from '~features/admin-form/create/builder-and-design/BuilderAndDesignContent/FieldRow/VerifiableFieldBuilderContainer'
import { getFieldCreationMeta } from '~features/admin-form/create/builder-and-design/utils/fieldCreation'
import {
  PaymentItemDetailsBlock,
  PaymentItemDetailsBlockV2,
} from '~features/public-form/components/FormPaymentPage/stripe/components/PaymentItemDetails'
import {
  VerifiableEmailField,
  VerifiableEmailFieldSchema,
} from '~features/verifiable-fields/Email'

type PaymentPreviewProps = {
  colorTheme?: FormColorTheme
  paymentDetails: FormPaymentsField
  isBuilder?: boolean
}

const PaymentPreviewV1 = ({
  colorTheme,
  paymentDetails,
  sectionColor,
}: {
  colorTheme: FormColorTheme
  paymentDetails: FormPaymentsFieldV1
  sectionColor: ReturnType<typeof useSectionColor>
}) => {
  return (
    <>
      <Box as="h2" mb="1rem" textStyle="h2" color={sectionColor}>
        Payment
      </Box>
      <Box mb="2rem">
        <PaymentItemDetailsBlock
          paymentItemName={paymentDetails.description}
          colorTheme={colorTheme}
          paymentAmount={paymentDetails.amount_cents}
        />
      </Box>
    </>
  )
}

const PaymentPreviewV2 = (props: {
  colorTheme: FormColorTheme
  paymentDetails: FormPaymentsFieldV2
  sectionColor: ReturnType<typeof useSectionColor>
}) => {
  return (
    <>
      <Box as="h2" mb="1rem" textStyle="h2" color={props.sectionColor}>
        {props.paymentDetails.description}
      </Box>
      <Box mb="2rem">
        <PaymentItemDetailsBlockV2
          paymentDetails={props.paymentDetails}
          colorTheme={props.colorTheme}
        />
      </Box>
    </>
  )
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
      {paymentDetails.version === 1 ? (
        <PaymentPreviewV1
          paymentDetails={paymentDetails}
          colorTheme={colorTheme}
          sectionColor={sectionColor}
        />
      ) : (
        <PaymentPreviewV2
          paymentDetails={paymentDetails}
          colorTheme={colorTheme}
          sectionColor={sectionColor}
        />
      )}
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
