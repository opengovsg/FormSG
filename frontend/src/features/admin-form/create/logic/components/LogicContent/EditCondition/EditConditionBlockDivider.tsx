import { Divider, Flex, Text } from '@chakra-ui/react'

export const EditConditionBlockDivider = (): JSX.Element => {
  return (
    <Flex w="100%" my="2rem">
      <Divider alignSelf="center" ml="-2rem" pr="2rem" />
      <Text p="0.625rem" textStyle="subhead-3" color="secondary.500">
        AND
      </Text>
      <Divider alignSelf="center" mr="-2rem" pl="2rem" />
    </Flex>
  )
}
