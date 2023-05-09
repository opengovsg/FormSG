import { useEffect, useMemo, useRef } from 'react'
import { Box, Flex, Stack, Text, VisuallyHidden } from '@chakra-ui/react'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.

export interface CreatePaymentIntentFailureBlockProps {
  submissionId: string
  focusOnMount?: boolean
}

export const CreatePaymentIntentFailureBlock = ({
  submissionId,
  focusOnMount,
}: CreatePaymentIntentFailureBlockProps): JSX.Element => {
  const { form } = usePublicFormContext()
  const formTitle = form?.title
  const focusRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focusOnMount) {
      focusRef.current?.focus()
    }
  }, [focusOnMount])

  const submittedAriaText = useMemo(() => {
    if (formTitle) {
      return `Error preparing payment for ${formTitle}. Please contact the form creator for assistance and provide them the Response ID: ${submissionId}.`
    }
    return `Error preparing payment. Please contact the form creator for assistance and provide them the Response ID: ${submissionId}.`
  }, [formTitle, submissionId])

  return (
    <Flex flexDir="column">
      <Stack tabIndex={-1} ref={focusRef} spacing="1rem">
        <Box>
          <VisuallyHidden aria-live="assertive">
            {submittedAriaText}
          </VisuallyHidden>
          <Text textStyle="h3" textColor="primary.500">
            There was an error preparing the payment.
          </Text>
          <Text textStyle="body-2" textColor="secondary.500">
            Please contact the agency which gave you this form link for
            assistance and share with them the Response ID below.
          </Text>
        </Box>
        <Text textStyle="body-1" textColor="secondary.700">
          No payment has been made for this form.
        </Text>

        <Text textColor="secondary.300">Response ID: {submissionId}</Text>
      </Stack>
    </Flex>
  )
}
