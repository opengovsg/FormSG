import { useState } from 'react'
import { Box, Flex } from '@chakra-ui/react'

import { useDirectoryAgencies } from '../queries'

import { DirectoryResultsAgencyHeader } from './DirectoryResultsAgencyHeader'
import { DirectoryResultsCantFindBox } from './DirectoryResultsCantFindBox'
import { DirectoryResultsList } from './DirectoryResultsList'
import { DirectoryResultsStickyNavbar } from './DirectoryResultsStickyNavbar'

export const CONTAINER_MAXW = '69.5rem'

export type DirectoryResultsProps = {
  agencyShortName: string
}

export const DirectoryResults = ({
  agencyShortName,
}: DirectoryResultsProps) => {
  const { data: agencies, isLoading } = useDirectoryAgencies()
  const [searchValue, setSearchValue] = useState<string>('')

  const agency = agencies?.find(
    ({ shortName }) => shortName === agencyShortName,
  )

  if (!isLoading && !agency) {
    // TODO: better page
    return <>Agency not found.</>
  }

  return (
    <Box mb="3rem">
      <DirectoryResultsStickyNavbar
        isLoading={isLoading}
        agencyName={agency?.fullName}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
      />
      <Flex flexDir="column" gap="3rem" maxW="100%">
        <DirectoryResultsAgencyHeader
          isLoading={isLoading}
          logo={agency?.logo}
          fullName={agency?.fullName}
        />
        <Flex flexDir="column" gap="1rem" px="8rem">
          <DirectoryResultsList
            agencyShortName={agencyShortName}
            searchValue={searchValue}
          />
          <DirectoryResultsCantFindBox />
        </Flex>
      </Flex>
    </Box>
  )
}
