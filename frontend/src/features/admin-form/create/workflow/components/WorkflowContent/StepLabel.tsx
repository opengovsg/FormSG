import { Stack, Text } from '@chakra-ui/react'

type StepLabelProps = {
  stepNumber: number
}

export const StepLabel = ({ stepNumber }: StepLabelProps) => (
  <Stack
    direction="row"
    spacing="1rem"
    alignItems="center"
    textStyle="subhead-3"
  >
    <Text
      py="0.5rem"
      px="1rem"
      borderWidth="1px"
      borderColor="brand.secondary.300"
      borderRadius="4px"
    >
      {stepNumber + 1}
    </Text>
    <Text>Step {stepNumber + 1}</Text>
  </Stack>
)
