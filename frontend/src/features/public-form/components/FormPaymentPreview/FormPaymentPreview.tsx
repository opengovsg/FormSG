import { Box, Stack } from '@chakra-ui/react'

import { PAYMENT_CONTACT_FIELD_ID } from '~shared/constants'
import {
  BasicField,
  EmailFieldBase,
  FormColorTheme,
  FormPaymentsField,
} from '~shared/types'

import { useSectionColor } from '~templates/Field/Section/SectionField'

import { getFieldCreationMeta } from '~features/admin-form/create/builder-and-design/utils/fieldCreation'
import {
  VerifiableEmailField,
  VerifiableEmailFieldSchema,
} from '~features/verifiable-fields/Email'

import { PaymentItemDetailsBlock } from '../FormPaymentPage/stripe/components/PaymentItemDetailsBlock'

export const FormPaymentPreview = ({
  colorTheme = FormColorTheme.Blue,
  paymentDetails,
}: {
  colorTheme: FormColorTheme
  paymentDetails: FormPaymentsField
}): JSX.Element => {
  const sectionColor = useSectionColor(colorTheme)
  const emailFieldSchema: VerifiableEmailFieldSchema = {
    ...(getFieldCreationMeta(BasicField.Email) as EmailFieldBase),
    title: 'Email Address',
    _id: PAYMENT_CONTACT_FIELD_ID,
    description: 'For delivery of invoice',
    isVerifiable: true,
  }
  return (
    <Stack px={{ base: '1rem', md: 0 }} pt="2.5rem">
      <Box bg={'white'} py="2.5rem" px={{ base: '1rem', md: '2.5rem' }}>
        <Box as="h2" mb="1rem" textStyle="h2" color={sectionColor}>
          Payment
        </Box>
        <PaymentItemDetailsBlock
          paymentItemName={paymentDetails.description}
          colorTheme={colorTheme}
          paymentAmount={paymentDetails.amount_cents}
        />
        <VerifiableEmailField schema={emailFieldSchema} />
      </Box>
    </Stack>
  )
}
