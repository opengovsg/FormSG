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
      px="8rem"
      py="4rem"
      gap="2rem"
      alignItems="center"
    >
      <Skeleton isLoaded={!isLoading} w="8rem">
        <Image
          src={logo}
          bgColor="white"
          h="8rem"
          p="0.5rem"
          border="1px"
          borderColor="primary.500"
          borderRadius="8px"
        />
      </Skeleton>
      <Skeleton isLoaded={!isLoading} minH="2rem" minW="12rem">
        <Text as="h2" textStyle="h2">
          {fullName}
        </Text>
      </Skeleton>
    </Flex>
  )
}
