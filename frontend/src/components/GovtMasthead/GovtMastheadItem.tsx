import { Flex, Icon, Text } from '@chakra-ui/react'

import { BxsBank } from '~assets/icons/BxsBank'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GovtMastheadItemProps {
  icon: React.ReactNode
  header: React.ReactNode
  subtext: React.ReactNode
}

export const GovtMastheadItem = ({
  icon,
  header,
  subtext,
}: GovtMastheadItemProps): JSX.Element => {
  return (
    <Flex flex={1} maxW="32rem">
      <Icon
        as={BxsBank}
        fontSize={{ base: '1rem', lg: '1.5rem' }}
        mr={{ base: '0.5rem', lg: '0.75rem' }}
      />
      <Flex flexDir="column">
        <Text textStyle={{ base: 'caption-1', lg: 'subhead-1' }} mb="0.75rem">
          {header}
        </Text>
        <Text>{subtext}</Text>
      </Flex>
    </Flex>
  )
}
