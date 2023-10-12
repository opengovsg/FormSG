import { Box, Flex } from '@chakra-ui/react'

import { DirectorySearchForm } from './DirectorySearchForm'
import { DirectorySearchSvgr } from './DirectorySearchSvgr'

export const DirectorySearch = () => {
  return (
    <Flex
      flexGrow={1}
      pt={{ base: '2rem', lg: '4rem' }}
      px={{ base: '2rem', md: '6rem', lg: '9rem' }}
      flexDir={{ base: 'column', lg: 'row' }}
    >
      <Flex flexGrow={1}>
        <DirectorySearchForm />
      </Flex>
      <Box display={{ base: 'none', lg: 'flex' }} flexGrow={{ base: 0, lg: 1 }}>
        <DirectorySearchSvgr />
      </Box>
    </Flex>
  )
}
