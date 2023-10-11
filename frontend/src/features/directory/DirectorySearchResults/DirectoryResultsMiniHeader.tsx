import { Box, Flex, Skeleton, Slide } from '@chakra-ui/react'

import { noPrintCss } from '~utils/noPrintCss'

import { DirectoryResultsLogo } from './DirectoryResultsLogo'
import { DirectoryResultsSearchbar } from './DirectoryResultsSearchbar'

export type DirectoryResultsMiniHeaderProps = {
  agency: string
  activeSearch: string
  setActiveSearch: (searchValue: string) => void
  isOpen: boolean
}

export const DirectoryResultsMiniHeader = ({
  agency,
  activeSearch,
  setActiveSearch,
  isOpen,
}: DirectoryResultsMiniHeaderProps): JSX.Element => (
  <Slide
    // Screen readers do not need to know of the existence of this component.
    aria-hidden
    direction="top"
    in={isOpen}
    style={{ zIndex: 1000 }}
  >
    <Box
      bg="white"
      borderBottomColor="secondary.300"
      borderBottomWidth="1px"
      px={{ base: '1.5rem', md: '2rem' }}
      py={{ base: '0.5rem', md: '1rem' }}
      sx={noPrintCss}
    >
      <Skeleton isLoaded={true}>
        <Flex
          align="center"
          flex={1}
          gap="0.5rem"
          justify="space-between"
          flexDir="row"
        >
          <Flex
            alignItems="center"
            minH={{ base: '4rem', md: '0' }}
            flex="1 1 0"
            w="100%"
            overflow="hidden"
            justifyContent="space-between"
          >
            <DirectoryResultsLogo agency={agency} />
            <Flex>
              <DirectoryResultsSearchbar
                activeSearch={activeSearch}
                setActiveSearch={setActiveSearch}
              />
            </Flex>
          </Flex>
        </Flex>
      </Skeleton>
    </Box>
  </Slide>
)
