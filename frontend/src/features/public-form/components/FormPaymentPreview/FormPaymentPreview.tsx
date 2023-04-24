import { Box, Stack, Text } from '@chakra-ui/react'

import { PAYMENT_CONTACT_FIELD_ID } from '~shared/constants'
import {
  BasicField,
  EmailFieldBase,
  FormColorTheme,
  FormPaymentsField,
} from '~shared/types'

import { centsToDollars } from '~utils/payments'
import { useSectionColor } from '~templates/Field/Section/SectionField'

import { getFieldCreationMeta } from '~features/admin-form/create/builder-and-design/utils/fieldCreation'
import {
  VerifiableEmailField,
  VerifiableEmailFieldSchema,
} from '~features/verifiable-fields/Email'

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
    _id: PAYMENT_CONTACT_FIELD_ID,
    description: 'Proof of payment will be sent to this email',
    isVerifiable: true,
  }
  return (
    <Stack px={{ base: '1rem', md: 0 }} pt="2.5rem">
      <Box bg={'white'} py="2.5rem" px={{ base: '1rem', md: '2.5rem' }}>
        <Box as="h2" mb="1rem" textStyle="h2" color={sectionColor}>
          Payment
        </Box>
        <Box
          backgroundColor={`theme-${colorTheme}.100`}
          borderWidth="1px"
          borderColor={`theme-${colorTheme}.300`}
          borderRadius="4px"
          p="0.7rem"
          mb="2rem"
        >
          <Text textStyle="body-1" mb="0.5rem">
            {paymentDetails.description}
          </Text>
          <Box as="h2" textStyle="h2">{`${centsToDollars(
            paymentDetails.amount_cents ?? 0,
          )} SGD`}</Box>
        </Box>
        <VerifiableEmailField schema={emailFieldSchema} />
      </Box>
    </Stack>
  )
}
