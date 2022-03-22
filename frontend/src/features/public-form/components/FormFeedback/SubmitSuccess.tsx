import { Box, Flex, Text } from '@chakra-ui/react'

export const SubmitSuccess = (): JSX.Element => {
  return (
    <Flex justify="center" py="1.5rem" px="1rem">
      <Box w="42.5rem" maxW="100%">
        <Text color="success.700" textStyle="subhead-1">
          Thank you for your feedback!
        </Text>
      </Box>
    </Flex>
  )
}
