import { Box, chakra, Flex, Skeleton, Text } from '@chakra-ui/react'

import { ReactComponent as BrandLogoSvg } from '~assets/svgs/brand/brand-hort-colour.svg'
import Searchbar from '~components/Searchbar'

const BrandLogo = chakra(BrandLogoSvg, {
  baseStyle: { h: '1.5rem' },
})

export type DirectoryResultsStickyNavbarProps = {
  isLoading: boolean
  agencyName?: string
  searchValue: string
  setSearchValue: (searchValue: string) => void
}

export const DirectoryResultsStickyNavbar = ({
  isLoading,
  agencyName,
  searchValue,
  setSearchValue,
}: DirectoryResultsStickyNavbarProps) => {
  return (
    <Flex
      justify="space-between"
      align="center"
      px={{ base: '1.5rem', md: '1.8rem', xl: '2rem' }}
      py="1rem"
      bg="white"
      borderBottom="1px"
      borderBottomColor="neutral.300"
      gap="2rem"
      position="sticky"
      top="0"
      zIndex={10}
    >
      <Flex flexShrink={0} gap="1rem" align="center">
        <Box pr="1rem" borderRight="1px" borderRightColor="secondary.300">
          <BrandLogo />
        </Box>
        <Skeleton isLoaded={!isLoading} minH="1rem" minW="12rem">
          <Text textStyle="subhead-3">{agencyName}</Text>
        </Skeleton>
      </Flex>

      <Flex flexShrink={1} width="100%">
        <Searchbar
          isExpandable={false}
          isDisabled={isLoading}
          placeholder={
            isLoading ? 'Loading...' : `Search forms from ${agencyName}`
          }
          value={searchValue}
          onSearch={setSearchValue}
        />
      </Flex>
    </Flex>
  )
}
