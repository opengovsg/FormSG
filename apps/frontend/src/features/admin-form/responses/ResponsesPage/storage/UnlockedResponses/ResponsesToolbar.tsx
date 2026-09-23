import { useTranslation } from 'react-i18next'
import { BiColumns, BiFilterAlt, BiGroup, BiSort } from 'react-icons/bi'
import { Box, Flex } from '@chakra-ui/react'

import Button from '~components/Button'

import { DownloadButton } from './DownloadButton'
import { SubmissionSearchbar } from './SubmissionSearchbar'

export const ResponsesToolbar = ({
  submissionId,
  setSubmissionId,
  isAnyFetching,
}: {
  submissionId?: string
  setSubmissionId: (submissionId: string | null) => void
  isAnyFetching: boolean
}): JSX.Element => {
  const { t } = useTranslation()
  const { filter, sort, group, columns } = t(
    'features.adminForm.responses.responsesPage.storage.unlockedResponses.toolbar',
    { returnObjects: true },
  )

  return (
    <Flex
      direction={{ base: 'column', lg: 'row' }}
      align={{ base: 'stretch', lg: 'center' }}
      justify="space-between"
      gap="0.75rem"
      w="100%"
      maxW="100%"
      mb="1rem"
      flexShrink={0}
    >
      <Flex align="center" gap="0.75rem" minW={0} flexWrap="wrap">
        <Box w={{ base: '100%', sm: '18rem' }} maxW="100%">
          <SubmissionSearchbar
            isExpandable={false}
            submissionId={submissionId}
            setSubmissionId={setSubmissionId}
            isAnyFetching={isAnyFetching}
          />
        </Box>
        <Button
          variant="clear"
          colorScheme="secondary"
          leftIcon={<BiFilterAlt fontSize="1.25rem" />}
        >
          {filter}
        </Button>
        <Button
          variant="clear"
          colorScheme="secondary"
          leftIcon={<BiSort fontSize="1.25rem" />}
        >
          {sort}
        </Button>
        <Button
          variant="clear"
          colorScheme="secondary"
          leftIcon={<BiGroup fontSize="1.25rem" />}
        >
          {group}
        </Button>
      </Flex>

      <Flex align="center" gap="0.75rem" flexShrink={0}>
        <Button
          variant="clear"
          colorScheme="secondary"
          leftIcon={<BiColumns fontSize="1.25rem" />}
        >
          {columns}
        </Button>
        <DownloadButton />
      </Flex>
    </Flex>
  )
}
