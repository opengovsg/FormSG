import { useTranslation } from 'react-i18next'
import { Container, Skeleton, Stack, Text } from '@chakra-ui/react'

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

  const { t } = useTranslation()

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
              {t(
                'features.adminForm.responses.components.secretKeyVerification.responsesToDate',
              )}
            </Text>
          </Skeleton>
        ) : null}
        <SecretKeyVerificationInput
          publicKey={formPublicKey}
          setSecretKey={setSecretKey}
          isLoading={isLoading}
          description={t(
            'features.adminForm.responses.components.secretKeyVerification.secretKeyVerificationInputDescription',
          )}
          isButtonFullWidth={false}
          showGuideLink={true}
          buttonText={ctaText}
        />
      </Stack>
    </Container>
  )
}
