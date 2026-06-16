import { Box, Flex, Stack, Text } from '@chakra-ui/react'

import Button from '~components/Button'

interface PeekCardProps {
  title: string
  subtitle?: string
  onDone: () => void
  doneLabel?: string
}

export const PeekCard = ({
  title,
  subtitle,
  onDone,
  doneLabel = 'Done',
}: PeekCardProps): JSX.Element => {
  return (
    <Box
      bg="primary.100"
      borderRadius="4px"
      border="1px solid"
      borderColor="primary.200"
      mt="-0.5rem"
      py="1.5rem"
      px={{ base: '1.5rem', md: '2rem' }}
    >
      <Stack spacing="1rem">
        <Stack spacing="0.25rem">
          <Text textStyle="subhead-1" color="secondary.500">
            {title}
          </Text>
          {subtitle && (
            <Text textStyle="body-1" color="secondary.400">
              {subtitle}
            </Text>
          )}
        </Stack>
        <Flex justify="flex-end">
          <Button onClick={onDone}>{doneLabel}</Button>
        </Flex>
      </Stack>
    </Box>
  )
}
