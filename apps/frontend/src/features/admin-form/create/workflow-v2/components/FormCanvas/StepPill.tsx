import { Center, Text } from '@chakra-ui/react'

type StepPillProps = {
  colourTheme: string
  stepNumber: number
}

export const StepPill = ({
  colourTheme,
  stepNumber,
}: StepPillProps): JSX.Element => {
  return (
    <Center
      w="20px"
      h="20px"
      borderRadius="full"
      bg={`${colourTheme}.500`}
      flexShrink={0}
    >
      <Text fontSize="10px" fontWeight="700" color="white" lineHeight="1">
        {stepNumber}
      </Text>
    </Center>
  )
}
