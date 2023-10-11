import { useState } from 'react'
import { Waypoint } from 'react-waypoint'
import { Flex, Text, useDisclosure } from '@chakra-ui/react'

import { DIRECTORY_ROUTE } from '~constants/routes'
import Button from '~components/Button'

import { DirectoryResultsList } from './DirectoryResultsList'
import { DirectoryResultsLogo } from './DirectoryResultsLogo'
import { DirectoryResultsMiniHeader } from './DirectoryResultsMiniHeader'
import { DirectoryResultsSearchbar } from './DirectoryResultsSearchbar'

export const DirectoryResults = ({ agency }: { agency: string }) => {
  const [activeSearch, setActiveSearch] = useState<string>('')
  const { isOpen, onOpen, onClose } = useDisclosure()

  const handlePositionChange = (pos: Waypoint.CallbackArgs) => {
    // Required so a page that loads in the middle of the page can still
    // trigger the mini header.
    if (pos.currentPosition === 'above') {
      onOpen()
    } else {
      onClose()
    }
  }

  return (
    <>
      <DirectoryResultsMiniHeader
        agency={agency}
        activeSearch={activeSearch}
        setActiveSearch={setActiveSearch}
        isOpen={isOpen}
      />
      <Flex flexDir="column" gap="1rem">
        <Flex
          flexDir={{ base: 'column', md: 'row' }}
          gap="1rem"
          justifyContent="space-between"
          alignItems={{ base: 'flex-start', md: 'center' }}
        >
          <Flex gap="1rem" alignItems="center">
            <DirectoryResultsLogo agency={agency} />
            <Text as="h2" textStyle="h2" color="primary.500">
              Forms created by {agency.toUpperCase()}
            </Text>
          </Flex>
          <Flex minW={{ base: '100%', md: '0' }}>
            <DirectoryResultsSearchbar
              activeSearch={activeSearch}
              setActiveSearch={setActiveSearch}
            />
          </Flex>
        </Flex>

        {/* Sentinel to know when sticky navbar is starting */}
        <Waypoint onPositionChange={handlePositionChange} />

        <DirectoryResultsList agency={agency} activeSearch={activeSearch} />
        <Flex
          flexDir={{ base: 'column', md: 'row' }}
          gap={{ base: '0.5rem', md: '1rem' }}
          alignSelf="center"
          alignItems="center"
        >
          <Text>Couldn't find what you wanted?</Text>
          <Button
            onClick={() => window.location.assign(`${DIRECTORY_ROUTE}`)}
            variant="outline"
            size="sm"
          >
            Try searching within a different agency
          </Button>
        </Flex>
      </Flex>
    </>
  )
}
