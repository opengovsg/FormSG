import { Flex, Stack, Text } from '@chakra-ui/react'

import { NoChargesSvg } from './NoChargesSvg'

export const BillingNoChargesContent = (): JSX.Element => (
  <Stack w="100%" spacing="1rem">
    <Text textStyle="h4" align="center" color="brand.primary.500">
      No results were found
    </Text>
    <Text align="center">
      Change the time period, or search for another e-service ID
    </Text>
    <Flex justifyContent="center">
      <NoChargesSvg />
    </Flex>
  </Stack>
)
