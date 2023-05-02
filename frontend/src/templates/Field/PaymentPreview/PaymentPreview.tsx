import { Box, Stack, Text } from '@chakra-ui/react'

import { PAYMENT_CONTACT_FIELD_ID } from '~shared/constants'
import {
  BasicField,
  EmailFieldBase,
  FormColorTheme,
  FormPaymentsField,
} from '~shared/types'

import { centsToDollars } from '~utils/payments'
import { EmailFieldInput } from '~templates/Field/Email'
import { useSectionColor } from '~templates/Field/Section/SectionField'

import { VerifiableFieldBuilderContainer } from '~features/admin-form/create/builder-and-design/BuilderAndDesignContent/FieldRow/VerifiableFieldBuilderContainer'
import { getFieldCreationMeta } from '~features/admin-form/create/builder-and-design/utils/fieldCreation'
import {
  VerifiableEmailField,
  VerifiableEmailFieldSchema,
} from '~features/verifiable-fields/Email'

type PaymentPreviewProps = {
  colorTheme?: FormColorTheme
  paymentDetails?: FormPaymentsField
  isBuilder?: boolean
  isActive?: boolean
  onClick?: () => void
}

export const PaymentPreview = ({
  colorTheme = FormColorTheme.Blue,
  paymentDetails,
  isBuilder,
  isActive,
  onClick,
}: PaymentPreviewProps) => {
  const sectionColor = useSectionColor(colorTheme)
  const emailFieldSchema: VerifiableEmailFieldSchema = {
    ...(getFieldCreationMeta(BasicField.Email) as EmailFieldBase),
    title: 'Email Address',
    _id: PAYMENT_CONTACT_FIELD_ID,
    description: 'For delivery of invoice',
    isVerifiable: true,
  }

  if (!paymentDetails || !paymentDetails.enabled) return null

  return (
    <Stack px={{ base: '1rem', md: 0 }} pt="2.5rem">
      <Box
        bg={'white'}
        py="2.5rem"
        px={{ base: '1rem', md: '2.5rem' }}
        {...(isBuilder && {
          _hover: { bg: 'secondary.100', cursor: 'pointer' },
          _active: {
            bg: 'secondary.100',
            boxShadow: '0 0 0 2px var(--chakra-colors-primary-500)',
            borderRadius: '4px',
          },
          'data-active': isActive || undefined,
          transition: 'ease',
          transitionDuration: '0.2s',
          onClick,
        })}
      >
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
        {isBuilder ? (
          <VerifiableFieldBuilderContainer schema={emailFieldSchema}>
            <EmailFieldInput schema={emailFieldSchema} />
          </VerifiableFieldBuilderContainer>
        ) : (
          <VerifiableEmailField schema={emailFieldSchema} />
        )}
      </Box>
    </Stack>
  )
}
