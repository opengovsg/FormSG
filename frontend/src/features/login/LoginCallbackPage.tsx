import { BiChevronRight } from 'react-icons/bi'
import { Link as ReactLink } from 'react-router-dom'
import {
  Box,
  Divider,
  Flex,
  Link,
  SkeletonText,
  Stack,
  Text,
} from '@chakra-ui/react'

import { SgidPublicOfficerEmployment } from '~shared/types/auth'

import { DASHBOARD_ROUTE, LOGIN_ROUTE } from '~constants/routes'

import { useUser } from '~features/user/queries'

import { useSgidProfiles } from './queries'

export const LoginCallbackPage = (): JSX.Element => {
  const profilesResponse = useSgidProfiles()

  const { user } = useUser()

  // If redirected back here but already authed, redirect to dashboard.
  if (user) window.location.replace(DASHBOARD_ROUTE)

  return (
    <Flex flex={1} justify="center" align="center" background="primary.100">
      <Stack
        maxWidth="24.5rem"
        padding="2rem"
        borderRadius="0.5rem"
        border="1px"
        borderColor="neutral.200"
        gap="1.75rem"
        background="white"
        divider={<Divider />}
      >
        <Text textStyle="h4">Choose an account to continue to FormSG</Text>

        {!profilesResponse.data ? (
          <SkeletonText noOfLines={3} />
        ) : (
          profilesResponse.data?.profiles.map((profile) => (
            <ProfileItem profile={profile} key={profile.workEmail} />
          ))
        )}
        <Link as={ReactLink} to={LOGIN_ROUTE}>
          Or, login manually using email and OTP
        </Link>
      </Stack>
    </Flex>
  )
}

const ProfileItem = ({ profile }: { profile: SgidPublicOfficerEmployment }) => {
  return (
    <Flex align="center">
      <Box>
        <Text
          textStyle="subhead-2"
          color="content.strong"
          marginBottom="0.25rem"
        >
          {profile.workEmail}
        </Text>
        <Text
          textStyle="caption-2"
          color="content.medium"
          marginBottom="0.25rem"
        >
          {[profile.agencyName, profile.departmentName].join(', ')}
        </Text>
        <Text textStyle="caption-2" color="content.medium">
          {profile.employmentTitle}
        </Text>
      </Box>
      <BiChevronRight fontSize="1.5rem" />
    </Flex>
  )
}
