import {
  Box,
  Flex,
  GridItem,
  GridProps,
  Skeleton,
  SkeletonText,
  Spinner,
  Text,
} from '@chakra-ui/react'

import { AppFooter } from '~/app/AppFooter'

import {
  BackgroundBox,
  BaseGridLayout,
  FooterGridArea,
  LoginGridArea,
} from '~features/login/LoginPageTemplate'

import {
  StatusTrackerBaseGridLayout,
  StatusTrackerFormInfoGridArea,
} from './StatusTrackerPage'

const StatusTrackerFormInfoSkeleton = (): JSX.Element => {
  return (
    <Box w="100%">
      <Flex direction="row">
        <Skeleton height="3rem" width="20rem" />
      </Flex>
      <Skeleton height="1.5rem" width="20rem" mt="1rem" />
    </Box>
  )
}

export const StatusTrackerSkeletonPage = (): JSX.Element => {
  return (
    <BackgroundBox>
      <StatusTrackerBaseGridLayout flex={1}>
        <StatusTrackerFormInfoGridArea>
          <StatusTrackerFormInfoSkeleton />
        </StatusTrackerFormInfoGridArea>
        <LoginGridArea>
          <Box mt={{ base: '1rem', lg: '10.125rem' }}>
            <Flex direction="column">
              <Box width="100%">
                <Skeleton height="2rem" width="36.5rem" mb="2rem" />
                <Skeleton height="20rem" width="11.5rem" />
              </Box>
            </Flex>
          </Box>
        </LoginGridArea>
      </StatusTrackerBaseGridLayout>
    </BackgroundBox>
  )
}
