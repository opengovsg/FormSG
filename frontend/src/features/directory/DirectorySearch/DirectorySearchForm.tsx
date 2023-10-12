import { useState } from 'react'
import {
  Box,
  Button,
  chakra,
  Flex,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import { ReactComponent as BrandLogoSvg } from '~assets/svgs/brand/brand-hort-colour.svg'
import { DIRECTORY_ROUTE } from '~constants/routes'
import { SingleSelect } from '~components/Dropdown'

import { useDirectoryAgencies } from '../queries'

export const BrandLogo = chakra(BrandLogoSvg, {
  baseStyle: {
    h: { base: '1.5rem', lg: '2rem' },
  },
})

export const DirectorySearchForm = () => {
  const buttonIsFullWidth = useBreakpointValue({
    base: true,
    md: false,
  })
  const { data: agencies, isLoading } = useDirectoryAgencies()
  const [selectedAgency, setSelectedAgency] = useState('')

  const agencyOptions =
    agencies?.map((agency) => ({
      value: agency.shortName,
      label: `${agency.fullName} (${agency.shortName.toUpperCase()})`,
    })) ?? []

  return (
    <Flex flexDir="column">
      <Box>
        <BrandLogo />
      </Box>
      <Flex
        flexDir="column"
        my={{ base: '3rem', lg: '6rem' }}
        gap={{ base: '1.5rem', lg: '3rem' }}
      >
        <Flex flexDir="column" gap={{ base: '0.5rem', lg: '1rem' }}>
          <Text
            as="h2"
            textStyle={{ base: 'display-2-mobile', lg: 'display-2' }}
            color="secondary.800"
          >
            Search forms from any agency
          </Text>
          <Text
            textStyle={{ base: 'subhead-1', lg: 'h2' }}
            color="secondary.300"
          >
            Select an agency to view all their forms
          </Text>
        </Flex>
        <Flex flexDir={{ base: 'column', md: 'row' }} gap="0.5rem">
          <Box minW={{ md: '30rem' }}>
            <SingleSelect
              isDisabled={isLoading}
              placeholder={isLoading ? 'Loading...' : 'Select an agency'}
              name="agency"
              value={selectedAgency}
              items={agencyOptions}
              onChange={setSelectedAgency}
              isClearable={false}
            />
          </Box>
          <Button
            isFullWidth={buttonIsFullWidth}
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
      </Flex>
    </Flex>
  )
}
