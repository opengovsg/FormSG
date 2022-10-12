import { Container, Skeleton, Stack, Text } from '@chakra-ui/react'
import simplur from 'simplur'

import { OGP_FORMSG_COLLATE } from '~constants/links'
import Link from '~components/Link'

import { useFormResponsesCount } from '../../queries'
import { EmptyResponses } from '../common/EmptyResponses'

import { EmailResponsesSvgr } from './EmailResponsesSvgr'

export const EmailResponsesTab = (): JSX.Element => {
  const { data: responsesCount, isLoading: isFormResponsesLoading } =
    useFormResponsesCount()

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
            {simplur` ${[responsesCount ?? 0]}response[|s] to date`}
          </Text>
        </Skeleton>
        <Text textStyle="body-1">
          FormSG does not store responses in Email mode. To collate the
          responses in your Outlook Inbox, use the{' '}
          <Link isExternal href={OGP_FORMSG_COLLATE}>
            Data Collation Tool
          </Link>
          .
        </Text>
      </Stack>
    </Container>
  )
}
