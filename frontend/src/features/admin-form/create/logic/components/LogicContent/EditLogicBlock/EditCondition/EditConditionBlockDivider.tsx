import { Divider, Flex, Text } from '@chakra-ui/react'

export const EditConditionBlockDivider = (): JSX.Element => {
  return (
    <Flex w="100%" my="2rem">
      <Divider
        alignSelf="center"
        ml={{ base: '-1.5rem', md: '-2rem' }}
        pr={{ base: '1.5rem', md: '2rem' }}
      />
      <Text p="0.625rem" textStyle="subhead-3" color="secondary.500">
        AND
      </Text>
      <Divider
        alignSelf="center"
        mr={{ base: '-1.5rem', md: '-2rem' }}
        pl={{ base: '1.5rem', md: '2rem' }}
      />
    </Flex>
  )
}
