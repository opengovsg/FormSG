import { FC } from 'react'
import { Flex, FlexProps } from '@chakra-ui/react'

export const LandingSection: FC<FlexProps> = ({ children, ...props }) => {
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
