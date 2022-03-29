import { useMemo } from 'react'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Stack,
  Text,
} from '@chakra-ui/react'
import { format } from 'date-fns'

import { FormDto } from '~shared/types/form'

import Button from '~components/Button'

export interface EndPageBlockProps {
  endPage: FormDto['endPage']
  submissionMeta: {
    formTitle: string
    submissionId: string
    timeInEpochMs: number
  }
}

export const EndPageBlock = ({
  endPage,
  submissionMeta,
}: EndPageBlockProps): JSX.Element => {
  const prettifiedDateString = useMemo(() => {
    return format(new Date(submissionMeta.timeInEpochMs), 'dd MMM yyyy, h:mm a')
  }, [submissionMeta])

  return (
    <Flex flexDir="column">
      <Accordion allowToggle m="-1rem" flex={1} variant="medium">
        <AccordionItem color="secondary.500" border="none">
          <AccordionButton>
            <Stack
              direction="row"
              spacing="1rem"
              textAlign="start"
              justify="space-between"
              flex={1}
            >
              <Stack spacing="1rem">
                <Text as="h2" textStyle="h2">
                  {endPage.title}
                </Text>

                {endPage.paragraph ? (
                  <Text color="secondary.500" textStyle="subhead-1">
                    {endPage.paragraph}
                  </Text>
                ) : null}
              </Stack>
              <AccordionIcon />
            </Stack>
          </AccordionButton>
          <AccordionPanel textStyle="body-1" color="secondary.400">
            <Text textStyle="subhead-1" color="secondary.500">
              {submissionMeta.formTitle}
            </Text>
            <Text>{submissionMeta.submissionId}</Text>
            <Text>{prettifiedDateString}</Text>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      <Box mt="2.25rem">
        <Button
          as="a"
          href={endPage.buttonLink ?? ''}
          variant="solid"
          colorScheme="primary"
        >
          {endPage.buttonText}
        </Button>
      </Box>
    </Flex>
  )
}
