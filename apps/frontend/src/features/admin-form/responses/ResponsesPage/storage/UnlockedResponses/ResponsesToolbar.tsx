import { Box, Flex } from '@chakra-ui/react'

import { ColumnsMenu } from './ColumnsMenu'
import { DownloadButton } from './DownloadButton'
import { FilterMenu } from './FilterMenu'
import { ResponsesSearchbar } from './ResponsesSearchbar'
import { SortMenu } from './SortMenu'

export const ResponsesToolbar = (): JSX.Element => {
  return (
    <Flex
      direction={{ base: 'column', lg: 'row' }}
      align={{ base: 'stretch', lg: 'center' }}
      justify="space-between"
      gap="0.75rem"
      w="100%"
      maxW="100%"
      mb="1rem"
      flexShrink={0}
    >
      <Flex align="center" gap="0.75rem" minW={0} flexWrap="wrap">
        <Box w={{ base: '100%', sm: '18rem' }} maxW="100%">
          <ResponsesSearchbar />
        </Box>
        <FilterMenu />
        <SortMenu />
        <ColumnsMenu />
      </Flex>

      <Flex align="center" gap="0.75rem" flexShrink={0}>
        <DownloadButton />
      </Flex>
    </Flex>
  )
}
