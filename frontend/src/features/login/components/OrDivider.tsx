import { Divider, HStack, Text } from '@chakra-ui/react'

export const OrDivider = (): JSX.Element => {
  return (
    <HStack spacing="2.5rem">
      <Divider />
      <Text color="content.medium">or</Text>
      <Divider />
    </HStack>
  )
}
