import { BiMailSend } from 'react-icons/bi'
import { Flex, Icon, Stack, Text } from '@chakra-ui/react'

export const EmailLabel = () => (
  <Stack
    direction="row"
    spacing="1.5rem"
    alignItems="center"
    textStyle="subhead-3"
  >
    <Flex
      py="0.5rem"
      px="0.75rem"
      borderWidth="1px"
      borderColor="secondary.300"
      borderRadius="4px"
      alignItems="center"
      justifyContent="center"
    >
      <Icon as={BiMailSend} boxSize="1.25rem" />
    </Flex>
    <Text>Completion email</Text>
  </Stack>
)
