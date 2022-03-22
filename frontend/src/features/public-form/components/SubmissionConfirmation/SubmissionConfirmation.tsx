import { useMemo } from 'react'
import { BiUpload } from 'react-icons/bi'
import { Box, Button, Flex, Stack, Text } from '@chakra-ui/react'
import { format } from 'date-fns'

import { useIsMobile } from '~hooks/useIsMobile'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormFeedback } from '../FormFeedback'

export const SubmissionConfirmation = (): JSX.Element | null => {
  const isMobile = useIsMobile()
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
      <Flex justify="center" bg="primary.100" py="4rem" px="1rem">
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
          <Stack direction={{ base: 'column', md: 'row' }} spacing="1rem">
            <Button
              isFullWidth={isMobile}
              leftIcon={<BiUpload fontSize="1.5rem" />}
            >
              Save my response
            </Button>
            <Button
              isFullWidth={isMobile}
              as="a"
              href={endPage.buttonLink}
              variant="clear"
              colorScheme="primary"
            >
              {endPage.buttonText}
            </Button>
          </Stack>
        </Box>
      </Flex>
      <FormFeedback />
    </Box>
  )
}
