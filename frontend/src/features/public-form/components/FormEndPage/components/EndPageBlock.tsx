import { Box, Flex, Stack, Text } from '@chakra-ui/react'

import { FormColorTheme, FormDto } from '~shared/types/form'

import Button from '~components/Button'

import { SubmissionData } from '~features/public-form/PublicFormContext'

export interface EndPageBlockProps {
  endPage: FormDto['endPage']
  submissionData: SubmissionData
  colorTheme?: FormColorTheme
}

export const EndPageBlock = ({
  endPage,
  submissionData,
  colorTheme = FormColorTheme.Blue,
}: EndPageBlockProps): JSX.Element => {
  return (
    <Flex flexDir="column">
      <Stack spacing="1rem">
        <Text as="h2" textStyle="h2" textColor="secondary.700">
          {endPage.title}
        </Text>
        {endPage.paragraph ? (
          <Text
            color="secondary.500"
            textStyle="subhead-1"
            whiteSpace="pre-line"
          >
            {endPage.paragraph}
          </Text>
        ) : null}
        <Text textColor="secondary.300">Response ID: {submissionData.id}</Text>
      </Stack>
      <Box mt="2.25rem">
        <Button
          as="a"
          href={endPage.buttonLink || window.location.href}
          variant="solid"
          colorScheme={`theme-${colorTheme}`}
        >
          {endPage.buttonText}
        </Button>
      </Box>
    </Flex>
  )
}
