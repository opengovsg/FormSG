import { FC } from 'react'
import { Flex, FlexProps } from '@chakra-ui/react'

export const LandingSection: FC<FlexProps> = ({ children, ...props }) => {
  return (
    <Flex px="9.25rem" py="5.5rem" flexDir="column" {...props}>
      {children}
    </Flex>
  )
}
