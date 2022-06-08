import { Flex, Text } from '@chakra-ui/react'

import Link from '~components/Link'

import { EmptyResponsesSvgr } from './EmptyResponsesSvgr'

export const EmptyResponses = (): JSX.Element => {
  return (
    <Flex justify="center" flexDir="column" align="center" px="2rem" py="4rem">
      <Text as="h2" textStyle="h2" color="primary.500" mb="1rem">
        You don't have any responses yet
      </Text>
      <Text textStyle="body-1" color="secondary.500">
        Try using{' '}
        <Link isExternal href="https://postman.gov.sg">
          Postman.gov.sg
        </Link>{' '}
        to send out your forms!
      </Text>
      <EmptyResponsesSvgr mt="1.5rem" w="280px" maxW="100%" />
    </Flex>
  )
}
