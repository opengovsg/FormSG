import { Flex, Stack, Text } from '@chakra-ui/react'

type StepLabelProps = {
  stepNumber: number
}

export const StepLabel = ({ stepNumber }: StepLabelProps) => {
  return (
    <Stack
      direction="row"
      spacing="1.5rem"
      alignItems="center"
      textStyle="subhead-3"
    >
      <Text
        py="0.5rem"
        px="1rem"
        borderWidth="1px"
        borderColor="secondary.300"
        borderRadius="4px"
      >
        {stepNumber + 1}
      </Text>
      <Flex direction="row">
        <Text>Step {stepNumber + 1}</Text>
      </Flex>
    </Stack>
  )
}
