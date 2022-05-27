import { Container, Skeleton, Stack, Text } from '@chakra-ui/react'
import simplur from 'simplur'

import Link from '~components/Link'

import { FormActivationSvg } from '~features/admin-form/settings/components/FormActivationSvg'

import { useFormResponsesCount } from '../queries'

import { EmptyResponses } from './EmptyResponses'

export const EmailResponsesTab = (): JSX.Element => {
  const { data: responsesCount, isLoading: isFormResponsesLoading } =
    useFormResponsesCount()

  if (responsesCount === 0) {
    return <EmptyResponses />
  }

  return (
    <Container
      overflowY="auto"
      px={{ base: '1.5rem', md: '3rem' }}
      py="2.25rem"
      maxW="69.5rem"
      flex={1}
      display="flex"
      flexDir="column"
      color="secondary.500"
    >
      <Container maxW="42.5rem">
        <Stack spacing="2rem">
          <FormActivationSvg />
          <Skeleton isLoaded={!isFormResponsesLoading} w="fit-content">
            <Text as="h2" textStyle="h2" whiteSpace="pre-line">
              <Text color="primary.500" as="span">
                {responsesCount?.toLocaleString() ?? '-'}
              </Text>
              {simplur` ${[responsesCount ?? 0]}response[|s] to date`}
            </Text>
          </Skeleton>
          <Text textStyle="body-1">
            FormSG does not store responses in Email mode. To collate the
            responses in your Outlook Inbox, use the{' '}
            <Link isExternal href="https://collate.form.gov.sg">
              Data Collation Tool
            </Link>
            .
          </Text>
        </Stack>
      </Container>
    </Container>
  )
}
