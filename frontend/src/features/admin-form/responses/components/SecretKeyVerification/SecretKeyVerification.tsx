import { Container, Skeleton, Stack, Text } from '@chakra-ui/react'
import simplur from 'simplur'

import SecretKeyVerificationInput from '~components/SecretKeyVerificationInput'

import { useStorageResponsesContext } from '../../ResponsesPage/storage'

export const SecretKeyVerification = ({
  heroSvg,
  ctaText,
  label,
  hideResponseCount,
}: {
  heroSvg: JSX.Element
  ctaText: string
  label: string
  hideResponseCount?: boolean
}): JSX.Element => {
  const { setSecretKey, formPublicKey, isLoading, totalResponsesCount } =
    useStorageResponsesContext()

  return (
    <Container p={0} maxW="42.5rem">
      <Stack spacing="2rem">
        {heroSvg}
        {!hideResponseCount ? (
          <Skeleton isLoaded={!isLoading} w="fit-content">
            <Text as="h2" textStyle="h2" whiteSpace="pre-wrap">
              <Text color="primary.500" as="span">
                {totalResponsesCount?.toLocaleString() ?? '-'}
              </Text>
              {simplur` ${[totalResponsesCount ?? 0]}response[|s] to date`}
            </Text>
          </Skeleton>
        ) : null}
        <SecretKeyVerificationInput
          publicKey={formPublicKey}
          setSecretKey={setSecretKey}
          isLoading={isLoading}
          description="Your Secret Key was downloaded when you created your form"
          isButtonFullWidth={false}
          showGuideLink={true}
          buttonText={ctaText}
        />
      </Stack>
    </Container>
  )
}
