import { BiMailSend } from 'react-icons/bi'
import { Flex, Icon, Stack, Text } from '@chakra-ui/react'

export const EmailLabel = () => (
  <Stack
    direction="row"
    spacing="1.5rem"
    alignItems="center"
    textStyle="subhead-1"
  >
    <Flex
      w="2.75rem"
      h="2.75rem"
      borderWidth="1px"
      borderColor="secondary.300"
      borderRadius="8px"
      bg="white"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Icon as={BiMailSend} boxSize="1.25rem" />
    </Flex>
    <Text>Completion email</Text>
  </Stack>
)
