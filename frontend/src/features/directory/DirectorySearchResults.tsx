import { Link } from 'react-router-dom'
import { Flex, Text } from '@chakra-ui/react'

import { DIRECTORY_ROUTE } from '~constants/routes'
import Button from '~components/Button'

import { useAgencyForms } from './queries'

export const DirectorySearchResults = ({ agency }: { agency: string }) => {
  const { data, isLoading } = useAgencyForms(agency)
  return (
    <>
      <Text as="h2" textStyle="h2" color="primary.500" mb="2rem">
        Showing results for {agency}
      </Text>
      <Flex flexDir="column" gap="1rem">
        {isLoading
          ? 'loading...'
          : !data || data.length === 0
          ? 'No data found'
          : data?.map(({ title, _id }) => (
              <Flex as={Link} to={`/${_id}`}>
                {title}
              </Flex>
            ))}
      </Flex>
      <Flex flexDir="column" gap="1rem">
        <Text mt="2rem">Didn't find what you want?</Text>
        <Button onClick={() => window.location.assign(`${DIRECTORY_ROUTE}`)}>
          Go back
        </Button>
      </Flex>
    </>
  )
}
