import { Box } from '@chakra-ui/react'

import SecretKeyVerificationInput from '~components/SecretKeyVerificationInput'
import { SecretKeyVerificationInputProps } from '~components/SecretKeyVerificationInput/SecretKeyVerificationInput'

export type SecretKeyVerificationProps = Omit<
  SecretKeyVerificationInputProps,
  'description' | 'isButtonFullWidth' | 'showGuideLink' | 'buttonText'
>

export const SecretKeyVerification = (
  props: SecretKeyVerificationProps,
): JSX.Element => {
  return (
    <Box bg="white" py="2.5rem" px={{ base: '1rem', md: '2.5rem' }}>
      <SecretKeyVerificationInput
        {...props}
        description="Secret key should have been sent to you by the form admin"
        buttonText="Unlock form"
        isButtonFullWidth={true}
        showGuideLink={false}
      />
    </Box>
  )
}
