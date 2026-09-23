import { useTranslation } from 'react-i18next'
import { Box, Container, Skeleton, Stack, Text } from '@chakra-ui/react'

import SecretKeyVerificationInput from '~components/SecretKeyVerificationInput'

import { useIsDelightfulDashboard } from '../../hooks'
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
  const isDelightfulDashboard = useIsDelightfulDashboard()

  const Wrapper = isDelightfulDashboard
    ? SecretKeyWrapper
    : LegacySecretKeyWrapper

  return (
    <Wrapper>
      <Stack spacing="2rem">
        {heroSvg}
        {!hideResponseCount ? (
          <Skeleton isLoaded={!isLoading} w="fit-content">
            <Text as="h2" textStyle="h2" whiteSpace="pre-wrap">
              <Text color="primary.500" as="span">
                {totalResponsesCount?.toLocaleString() ?? '-'}
              </Text>
              {' ' +
                t(
                  'features.adminForm.responses.components.secretKeyVerification.responsesToDate',
                  { count: totalResponsesCount ?? 0 },
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
    </Wrapper>
  )
}

const SecretKeyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Box pt={{ base: '1.5rem', md: '2rem' }}>{children}</Box>
)

const LegacySecretKeyWrapper = ({
  children,
}: {
  children: React.ReactNode
}) => (
  <Container p={0} maxW="42.5rem">
    {children}
  </Container>
)
