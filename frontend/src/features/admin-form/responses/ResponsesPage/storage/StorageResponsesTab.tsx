import { useTranslation } from 'react-i18next'
import { Container, Flex } from '@chakra-ui/react'

import { FormActivationSvg } from '~features/admin-form/settings/components/FormActivationSvg'

import { SecretKeyVerification } from '../../components/SecretKeyVerification'
import { EmptyResponses } from '../common/EmptyResponses'

import { useStorageResponsesContext } from './StorageResponsesContext'
import { UnlockedResponses } from './UnlockedResponses'

export const StorageResponsesTab = (): JSX.Element => {
  const { t } = useTranslation()
  const { totalResponsesCount, secretKey } = useStorageResponsesContext()

  if (totalResponsesCount === 0) {
    return <EmptyResponses />
  }

  return secretKey ? (
    <UnlockedResponses />
  ) : (
    <Flex
      flexDir="column"
      align="center"
      px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
    >
      <Container p={0} maxW="42.5rem">
        <SecretKeyVerification
          heroSvg={<FormActivationSvg />}
          ctaText={t(
            'features.adminForm.responses.responsesPage.storage.storageResponsesTab.secretKeyVerification.ctaText',
          )}
          label={t(
            'features.adminForm.responses.responsesPage.storage.storageResponsesTab.secretKeyVerification.label',
          )}
        />
      </Container>
    </Flex>
  )
}
