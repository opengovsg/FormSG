import { Container, Skeleton, Stack, Text } from '@chakra-ui/react'
import simplur from 'simplur'

import Link from '~components/Link'

import { useFormResponsesCount } from '../../queries'
import { EmptyResponses } from '../common/EmptyResponses'
import { ResponsesTabWrapper } from '../common/ResponsesTabWrapper'

import { EmailResponsesSvgr } from './EmailResponsesSvgr'

export const EmailResponsesTab = (): JSX.Element => {
  const { data: responsesCount, isLoading: isFormResponsesLoading } =
    useFormResponsesCount()

  if (responsesCount === 0) {
    return <EmptyResponses />
  }

  return (
    <ResponsesTabWrapper>
      <Container p={0} maxW="42.5rem">
        <Stack spacing="2rem">
          <EmailResponsesSvgr />
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
    </ResponsesTabWrapper>
  )
}
