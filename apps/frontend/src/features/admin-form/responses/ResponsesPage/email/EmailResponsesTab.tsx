import { useTranslation } from 'react-i18next'
import { Container, Skeleton, Stack, Text } from '@chakra-ui/react'

import { useFormResponsesCount } from '../../queries'
import { EmptyResponses } from '../common/EmptyResponses'

import { EmailResponsesSvgr } from './EmailResponsesSvgr'

export const EmailResponsesTab = (): JSX.Element => {
  const { data: responsesCount, isLoading: isFormResponsesLoading } =
    useFormResponsesCount()

  const { t } = useTranslation()

  if (responsesCount === 0) {
    return <EmptyResponses />
  }

  return (
    <Container p={0} maxW="42.5rem">
      <Stack spacing="2rem">
        <EmailResponsesSvgr />
        <Skeleton isLoaded={!isFormResponsesLoading} w="fit-content">
          <Text as="h2" textStyle="h2" whiteSpace="pre-wrap">
            <Text color="primary.500" as="span">
              {responsesCount?.toLocaleString() ?? '-'}
            </Text>
            {' ' +
              t(
                'features.adminForm.responses.responsesPage.emailResponsesTab.responsesToDate',
                { responsesCount: responsesCount ?? 0 },
              )}
          </Text>
        </Skeleton>
        <Text textStyle="body-1">
          {t(
            'features.adminForm.responses.responsesPage.emailResponsesTab.responsesNotStoredInEmailMode',
          )}
        </Text>
      </Stack>
    </Container>
  )
}
