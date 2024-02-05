import React from 'react'
import { Divider, Stack } from '@chakra-ui/react'

/**
 * Presentational wrapper over chakra-ui's `<Stack />` for payment elements.
 */
export const PaymentStack = ({
  noBg,
  children,
}: {
  noBg?: boolean
  children: React.ReactNode
}) => {
  const backgroundColour = noBg ? 'transparent' : 'white'
  return (
    <Stack
      pt="1.5rem"
      px={{ base: '1.5rem', md: '4rem' }}
      bg={backgroundColour}
      w="100%"
      divider={<Divider />}
    >
      {children}
    </Stack>
  )
}
