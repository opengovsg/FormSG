import { Flex, Image, Skeleton, Text } from '@chakra-ui/react'

export type DirectoryResultsAgencyHeaderProps = {
  isLoading: boolean
  logo?: string
  fullName?: string
}

export const DirectoryResultsAgencyHeader = ({
  isLoading,
  logo,
  fullName,
}: DirectoryResultsAgencyHeaderProps) => {
  return (
    <Flex
      bgColor="primary.100"
      px={{ base: '2rem', md: '5.5rem', lg: '8rem' }}
      py={{ base: '2rem', md: '4rem' }}
      gap={{ base: '1rem', md: '2rem' }}
      alignItems="center"
    >
      <Skeleton isLoaded={!isLoading} minW={{ base: '4rem', md: '8rem' }}>
        <Image
          src={logo}
          bgColor="white"
          h={{ base: '6rem', md: '8rem' }}
          p="0.5rem"
          border="1px"
          borderColor="primary.500"
          borderRadius="8px"
        />
      </Skeleton>
      <Skeleton isLoaded={!isLoading} minH="2rem" minW="12rem">
        <Text as="h2" textStyle={{ base: 'h3', md: 'h2' }}>
          {fullName}
        </Text>
      </Skeleton>
    </Flex>
  )
}
