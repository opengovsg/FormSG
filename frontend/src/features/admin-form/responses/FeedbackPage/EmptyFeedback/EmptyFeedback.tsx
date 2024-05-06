import { Flex, Text } from '@chakra-ui/react'
import { Link } from '@opengovsg/design-system-react'

import { OGP_POSTMAN } from '~constants/links'

import { EmptyFeedbackSvgr } from './EmptyFeedbackSvgr'

export const EmptyFeedback = (): JSX.Element => {
  return (
    <Flex justify="center" flexDir="column" align="center" px="2rem" py="4rem">
      <Text as="h2" textStyle="h4" color="brand.primary.500" mb="1rem">
        You don't have any feedback yet
      </Text>
      <Text textStyle="body-1" color="brand.secondary.500">
        Try using{' '}
        <Link isExternal href={OGP_POSTMAN}>
          Postman.gov.sg
        </Link>{' '}
        to send out your forms!
      </Text>
      <EmptyFeedbackSvgr mt="1.5rem" w="380px" maxW="100%" />
    </Flex>
  )
}
