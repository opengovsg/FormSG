import { Divider, Flex, Text } from '@chakra-ui/react'

import Toggle from '~components/Toggle'

export const PaymentMethodsSection = () => (
  <Flex flexDir="column" gap="2.5rem">
    <Divider />
    <Text textStyle="h3" color="secondary.500">
      Payment Methods
    </Text>
    <Toggle label="Credit and debit card" />
    <Toggle label="PayNow" />
  </Flex>
)
