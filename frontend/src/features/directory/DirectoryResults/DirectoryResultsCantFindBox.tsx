import { BiRightArrowAlt } from 'react-icons/bi'
import { Button, Flex, Text } from '@chakra-ui/react'

import { DIRECTORY_ROUTE } from '~constants/routes'

import { DirectoryResultsCantFindSvgr } from './DirectoryResultsCantFindSvgr'

export const DirectoryResultsCantFindBox = () => {
  return (
    <Flex
      flexDir={{ base: 'column', lg: 'row' }}
      justifyContent="space-between"
      alignItems="center"
      bgColor="primary.100"
      px="2rem"
      py={{ base: '2rem', lg: '1rem' }}
      gap={{ base: '2rem', lg: 'none' }}
    >
      <Flex
        flexDir="column"
        alignItems={{ base: 'center', lg: 'flex-start' }}
        gap="1rem"
      >
        <Text textStyle="subhead-3">Can't find what you're looking for?</Text>
        <Button
          onClick={() => window.location.assign(`${DIRECTORY_ROUTE}`)}
          rightIcon={<BiRightArrowAlt size="1.5rem" />}
        >
          Try searching within a different agency
        </Button>
      </Flex>

      <DirectoryResultsCantFindSvgr />
    </Flex>
  )
}
