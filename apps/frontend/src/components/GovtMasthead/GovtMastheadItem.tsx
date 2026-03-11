import { As, Flex, Icon, Text } from '@chakra-ui/react'

export interface GovtMastheadItemProps {
  icon: As
  header: string
  children: React.ReactNode
}

export const GovtMastheadItem = ({
  icon,
  header,
  children,
}: GovtMastheadItemProps): JSX.Element => {
  return (
    <Flex flex={1} maxW="32rem">
      <Icon
        aria-hidden
        as={icon}
        fontSize={{ base: '1rem', lg: '1.5rem' }}
        mr={{ base: '0.5rem', lg: '0.75rem' }}
      />
      <Flex flexDir="column">
        <Text textStyle={{ base: 'caption-1', lg: 'subhead-1' }} mb="0.75rem">
          {header}
        </Text>
        {children}
      </Flex>
    </Flex>
  )
}
