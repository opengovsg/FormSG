import { useMemo } from 'react'
import { BiUpload } from 'react-icons/bi'
import { Box, Button, ButtonGroup, Flex, Stack, Text } from '@chakra-ui/react'
import { format } from 'date-fns'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

export const SubmissionConfirmation = (): JSX.Element | null => {
  const { submissionData, form: { endPage } = {} } = usePublicFormContext()

  const prettifiedDateString = useMemo(() => {
    if (!submissionData) return null
    return format(new Date(submissionData.timeInEpochMs), 'dd MMM yyyy, h:mm a')
  }, [submissionData])

  if (!submissionData || !endPage) {
    return null
  }

  return (
    <Box flex={1}>
      <Flex justify="center" bg="primary.100" p="4rem">
        <Box w="42.5rem" maxW="100%">
          <Stack spacing="0.5rem" mb="1.5rem">
            <Text textStyle="caption-2" color="secondary.400">
              {prettifiedDateString}, Response ID: {submissionData.id}
            </Text>
            <Text textStyle="h2" as="h2" color="secondary.500">
              {endPage.title}
            </Text>
            <Text textStyle="body-2" color="secondary.500">
              {endPage.paragraph}
            </Text>
          </Stack>
          <ButtonGroup spacing="1rem">
            <Button leftIcon={<BiUpload fontSize="1.5rem" />}>
              Save my response
            </Button>
            <Button
              as="a"
              href={endPage.buttonLink}
              variant="clear"
              colorScheme="primary"
            >
              {endPage.buttonText}
            </Button>
          </ButtonGroup>
        </Box>
      </Flex>
    </Box>
  )
}
