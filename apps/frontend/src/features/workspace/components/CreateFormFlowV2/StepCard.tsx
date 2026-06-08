import { Box, Center, Flex, Text } from '@chakra-ui/react'

export type StepStatus = 'pending' | 'active' | 'done'

export const StepIndicator = ({
  status,
  stepNumber,
}: {
  status: StepStatus
  stepNumber: number
}): JSX.Element => {
  if (status === 'done') {
    return (
      <Center
        w="2rem"
        h="2rem"
        borderRadius="full"
        bg="success.500"
        flexShrink={0}
      >
        <Text textStyle="subhead-2" color="white" fontSize="0.875rem">
          {stepNumber}
        </Text>
      </Center>
    )
  }

  if (status === 'active') {
    return (
      <Center w="2rem" h="2rem" borderRadius="full" bg="#445FCD" flexShrink={0}>
        <Text textStyle="subhead-2" color="white" fontSize="0.875rem">
          {stepNumber}
        </Text>
      </Center>
    )
  }

  return (
    <Center
      w="2rem"
      h="2rem"
      borderRadius="full"
      bg="neutral.200"
      flexShrink={0}
    >
      <Text textStyle="subhead-2" color="secondary.400" fontSize="0.875rem">
        {stepNumber}
      </Text>
    </Center>
  )
}

export const StepCard = ({
  status,
  stepNumber,
  title,
  children,
}: {
  status: StepStatus
  stepNumber: number
  title: string
  children?: React.ReactNode
}): JSX.Element => {
  return (
    <Box opacity={status === 'pending' ? 0.4 : 1} transition="opacity 0.15s">
      <Flex align="center" gap="0.75rem">
        <StepIndicator status={status} stepNumber={stepNumber} />
        <Text
          textStyle="subhead-1"
          color={status === 'pending' ? 'secondary.400' : 'secondary.500'}
        >
          {title}
        </Text>
      </Flex>
      {children && (status === 'active' || status === 'done') && (
        <Box mt="0.75rem" pl="2.75rem">
          {children}
        </Box>
      )}
    </Box>
  )
}
