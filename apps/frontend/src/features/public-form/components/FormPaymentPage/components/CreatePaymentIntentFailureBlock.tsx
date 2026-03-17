import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Flex, Stack, Text, VisuallyHidden } from '@chakra-ui/react'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.

export interface CreatePaymentIntentFailureBlockProps {
  submissionId: string
  focusOnMount?: boolean
}

export const CreatePaymentIntentFailureBlock = ({
  submissionId,
  focusOnMount,
}: CreatePaymentIntentFailureBlockProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.publicForm.components.payment.error',
  })
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
      return t('ariaLabel', { formTitle, submissionId })
    }
    return t('ariaLabelNoTitle', { submissionId })
  }, [formTitle, submissionId, t])

  return (
    <Flex flexDir="column" mb="1rem">
      <Stack tabIndex={-1} ref={focusRef} spacing="1rem" pb="2rem">
        <Box pt="0.5rem">
          <VisuallyHidden aria-live="assertive">
            {submittedAriaText}
          </VisuallyHidden>
          <Text textStyle="h3" textColor="primary.500">
            {t('header')}
          </Text>
        </Box>
        <Text textStyle="body-1" textColor="secondary.700">
          {t('body')}
        </Text>

        <Text textColor="secondary.300">
          {t('responseId', { submissionId })}
        </Text>
      </Stack>
    </Flex>
  )
}
