import { Flex, FlexProps } from '@chakra-ui/react'

import { FCC } from '~typings/react'

export const LandingSection: FCC<FlexProps> = ({ children, ...props }) => {
  return (
    <Flex
      px={{ base: '1.5rem', md: '5.5rem', lg: '9.25rem' }}
      pt={{ base: '3.5rem', md: '5.5rem' }}
      pb={{ base: '3.5rem', md: '5.5rem' }}
      flexDir="column"
      {...props}
    >
      {children}
    </Flex>
  )
}
