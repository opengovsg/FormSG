import { useMemo } from 'react'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Container,
  Flex,
  Stack,
  Text,
} from '@chakra-ui/react'
import { format } from 'date-fns'

import { FormDto } from '~shared/types/form'

import Button from '~components/Button'

import { ThankYouSvgr } from './ThankYouSvgr'

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
    <Container w="42.5rem" maxW="100%">
      <Flex flexDir="column" align="center">
        <ThankYouSvgr pt="2.5rem" />
        <Flex py="2rem" px="3rem" bg="white" w="100%" flexDir="column">
          <Accordion allowToggle flex={1} variant="medium">
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
          <Stack
            mt="2.25rem"
            px="1rem"
            direction={{ base: 'column', md: 'row' }}
            spacing="1rem"
          >
            <Button
              as="a"
              href={endPage.buttonLink ?? ''}
              variant="solid"
              colorScheme="primary"
            >
              {endPage.buttonText}
            </Button>
          </Stack>
        </Flex>
      </Flex>
    </Container>
  )
}
