import { useEffect, useState } from 'react'
import { BiChevronRight } from 'react-icons/bi'
import { Link as ReactLink } from 'react-router-dom'
import {
  Box,
  Divider,
  Flex,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SkeletonText,
  Stack,
  Text,
  useDisclosure,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { SgidPublicOfficerEmployment } from '~shared/types/auth'

import { LOGGED_IN_KEY } from '~constants/localStorage'
import { DASHBOARD_ROUTE, LOGIN_ROUTE } from '~constants/routes'
import { useIsMobile } from '~hooks/useIsMobile'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { ApiService } from '~services/ApiService'
import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { useUser } from '~features/user/queries'

import { SGID_PROFILES_ENDPOINT, useSgidProfiles } from './queries'

type ModalErrorMessages = {
  header: string
  body: string
  cta: string
}

const MODAL_ERRORS: Record<string, ModalErrorMessages> = {
  NO_WORKEMAIL: {
    header: "Singpass login isn't available to you yet",
    body: 'It is progressively being made available to organisations. In the meantime, please log in using your email address.',
    cta: 'Back to login',
  },
  INVALID_WORKEMAIL: {
    header: "You don't have access to this service",
    body: 'It may be available only to select organisations or authorised individuals. If you believe you should have access to this service, please contact us.',
    cta: 'Choose another account',
  },
}
type ErrorDisclosureProps = Pick<UseDisclosureReturn, 'onClose' | 'isOpen'>
const ErrorDisclosure = (
  props: {
    errorMessages: ModalErrorMessages | undefined
  } & ErrorDisclosureProps,
) => {
  const isMobile = useIsMobile()
  if (!props.errorMessages) {
    return null
  }
  return (
    <Modal isOpen={props.isOpen} onClose={() => props.onClose()}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>{props.errorMessages.header}</ModalHeader>
        <ModalBody>
          <Stack>
            <Text>{props.errorMessages.body}</Text>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button
            isFullWidth={isMobile}
            onClick={() => window.location.assign(LOGIN_ROUTE)}
          >
            {props.errorMessages.cta}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
export const LoginCallbackPage = (): JSX.Element => {
  const profilesResponse = useSgidProfiles()
  const [, setIsAuthenticated] = useLocalStorage<boolean>(LOGGED_IN_KEY)
  const { user } = useUser()
  const [errorContext, setErrorContext] = useState<
    ModalErrorMessages | undefined
  >()

  const errorDisclosure = useDisclosure()

  // If redirected back here but already authed, redirect to dashboard.
  if (user) window.location.replace(DASHBOARD_ROUTE)
  // User doesn't have any profiles, should reattempt to login
  if (profilesResponse.error) window.location.replace(LOGIN_ROUTE)

  useEffect(() => {
    if (profilesResponse.data?.profiles.length === 0) {
      errorDisclosure.onOpen()
      setErrorContext(MODAL_ERRORS.NO_WORKEMAIL)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilesResponse.data?.profiles.length])

  const handleSetProfile = async (profile: SgidPublicOfficerEmployment) => {
    await ApiService.post<void>(SGID_PROFILES_ENDPOINT, {
      workEmail: profile.workEmail,
    })
    window.location.assign(DASHBOARD_ROUTE)
    setIsAuthenticated(true)
  }

  return (
    <Flex flex={1} justify="center" align="center" background="primary.100">
      <Stack
        maxWidth="24.5rem"
        padding="2rem"
        borderRadius="0.5rem"
        border="1px"
        borderColor="neutral.200"
        gap="1rem"
        background="white"
        divider={<Divider />}
      >
        <Text textStyle="h2" marginBottom="0.5rem" color="secondary.700">
          Choose an account to continue to FormSG
        </Text>

        {!profilesResponse.data ? (
          <SkeletonText noOfLines={3} />
        ) : (
          profilesResponse.data?.profiles.map((profile) => (
            <ProfileItem
              profile={profile}
              key={profile.workEmail}
              onClick={() => handleSetProfile(profile)}
            />
          ))
        )}

        <Link
          marginTop="0.5rem"
          textStyle="caption-1"
          as={ReactLink}
          to={LOGIN_ROUTE}
        >
          Or, login manually using email and OTP
        </Link>
      </Stack>
      <ErrorDisclosure {...errorDisclosure} errorMessages={errorContext} />
    </Flex>
  )
}

const ProfileItem = ({
  profile,
  onClick,
}: {
  profile: SgidPublicOfficerEmployment
  onClick: () => void
}) => {
  return (
    <Flex align="center" cursor="pointer" onClick={onClick}>
      <Box>
        <Text
          textStyle="subhead-2"
          color="secondary.700"
          marginBottom="0.25rem"
        >
          {profile.workEmail}
        </Text>
        <Text
          textStyle="caption-2"
          color="secondary.400"
          marginBottom="0.25rem"
        >
          {[profile.agencyName, profile.departmentName].join(', ')}
        </Text>
        <Text textStyle="caption-2" color="secondary.400">
          {profile.employmentTitle}
        </Text>
      </Box>
      <Box marginLeft="0.5rem">
        <BiChevronRight fontSize="1.5rem" />
      </Box>
    </Flex>
  )
}
