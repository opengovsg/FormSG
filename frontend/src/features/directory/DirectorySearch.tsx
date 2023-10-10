import { useState } from 'react'
import { Button, Flex, Text } from '@chakra-ui/react'

import { DIRECTORY_ROUTE } from '~constants/routes'
import { useIsMobile } from '~hooks/useIsMobile'
import { SingleSelect } from '~components/Dropdown'

import { useDirectoryAgencies } from './queries'

export const DirectorySearch = () => {
  const isMobile = useIsMobile()

  const { data: agencies, isLoading } = useDirectoryAgencies()
  const [selectedAgency, setSelectedAgency] = useState('')

  const agencyOptions =
    agencies?.map((agency) => ({
      value: agency.shortName,
      label: `${agency.fullName} (${agency.shortName})`,
    })) ?? []

  return (
    <>
      <Text as="h2" textStyle="h2" color="primary.500" mb="0.5rem">
        Search for forms...
      </Text>
      <Text textStyle="body-1" color="secondary.500" mb="1rem">
        Get started by selecting an agency
      </Text>
      <Flex gap="0.5rem">
        <SingleSelect
          isDisabled={isLoading}
          placeholder={isLoading ? 'Loading...' : 'Select an agency'}
          name="agency"
          value={selectedAgency}
          items={agencyOptions}
          onChange={setSelectedAgency}
          isClearable={false}
        />
        <Button
          isFullWidth={isMobile}
          isDisabled={isLoading || !selectedAgency}
          onClick={() =>
            window.location.assign(
              `${DIRECTORY_ROUTE}?agency=${selectedAgency}`,
            )
          }
        >
          Search
        </Button>
      </Flex>
    </>
  )
}
