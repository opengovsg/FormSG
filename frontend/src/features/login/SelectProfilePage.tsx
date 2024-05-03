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
import { StatusCodes } from 'http-status-codes'

import { SUPPORT_FORM_LINK } from '~shared/constants'
import { SgidPublicOfficerEmployment } from '~shared/types/auth'

import { LOGGED_IN_KEY } from '~constants/localStorage'
import { DASHBOARD_ROUTE, LOGIN_ROUTE } from '~constants/routes'
import { useIsMobile } from '~hooks/useIsMobile'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { useToast } from '~hooks/useToast'
import { ApiService } from '~services/ApiService'
import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { useUser } from '~features/user/queries'

import { SGID_PROFILES_ENDPOINT, useSgidProfiles } from './queries'

type ErrorDisclosureProps = Pick<UseDisclosureReturn, 'onClose' | 'isOpen'>
type ModalErrorMessages = {
  hideCloseButton?: boolean
  preventBackdropDismissal?: boolean
  header: string
  body: string | (() => React.ReactElement)
  cta: string
  onCtaClick: (disclosureProps: ErrorDisclosureProps) => void
}

const MODAL_ERRORS: Record<string, ModalErrorMessages> = {
  NO_WORKEMAIL: {
    hideCloseButton: true,
    preventBackdropDismissal: true,
    header: "Singpass login isn't available to you yet",
    body: 'It is progressively being made available to agencies. In the meantime, please log in using your email address.',
    cta: 'Back to login',
    onCtaClick: () => window.location.assign(LOGIN_ROUTE),
  },
  INVALID_WORKEMAIL: {
    header: "You don't have access to this service",
    body: () => (
      <Text>
        It may be available only to select agencies or authorised individuals.
        If you believe you should have access to this service, please{' '}
        <Link isExternal href={SUPPORT_FORM_LINK}>
          contact us
        </Link>
        .
      </Text>
    ),
    cta: 'Choose another account',
    onCtaClick: (disclosureProps) => disclosureProps.onClose(),
  },
}

const ErrorDisclosure = (
  props: {
    errorMessages: ModalErrorMessages | undefined
  } & ErrorDisclosureProps,
) => {
  const isMobile = useIsMobile()
  if (!props.errorMessages) {
    return null
  }
  const { errorMessages, ...disclosureProps } = props
  const {
    onCtaClick,
    body,
    cta,
    hideCloseButton,
    header,
    preventBackdropDismissal,
  } = errorMessages
  return (
    <Modal
      isOpen={props.isOpen}
      onClose={() => props.onClose()}
      closeOnOverlayClick={!preventBackdropDismissal}
    >
      <ModalOverlay />
      <ModalContent>
        {!hideCloseButton ? <ModalCloseButton /> : null}
        <ModalHeader>{header}</ModalHeader>
        <ModalBody>
          <Stack>
            {typeof body === 'function' ? body() : <Text>{body}</Text>}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button
            isFullWidth={isMobile}
            onClick={() => onCtaClick(disclosureProps)}
          >
            {cta}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
export const SelectProfilePage = (): JSX.Element => {
  const profilesResponse = useSgidProfiles()
  const [, setIsAuthenticated] = useLocalStorage<boolean>(LOGGED_IN_KEY)
  const { user } = useUser()
  const [errorContext, setErrorContext] = useState<
    ModalErrorMessages | undefined
  >()

  const errorDisclosure = useDisclosure()
  const toast = useToast({ isClosable: true, status: 'danger' })

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
    ApiService.post<void>(SGID_PROFILES_ENDPOINT, {
      workEmail: profile.work_email,
    })
      .then(() => {
        window.location.assign(DASHBOARD_ROUTE)
        setIsAuthenticated(true)
      })
      .catch((err) => {
        console.log({ err })
        if (err.code === StatusCodes.UNAUTHORIZED) {
          errorDisclosure.onOpen()
          setErrorContext(MODAL_ERRORS.INVALID_WORKEMAIL)
          return
        }
        toast({ description: 'Something went wrong. Please try again later.' })
      })
  }

  return (
    <Flex
      flex={1}
      justify="center"
      align="center"
      background="brand.primary.50"
    >
      <Stack
        width={{ base: '24.5rem', lg: '42.5rem' }}
        padding="2rem"
        borderRadius="0.5rem"
        border="1px"
        borderColor="neutral.200"
        gap="1rem"
        background="white"
        divider={<Divider />}
      >
        <Text textStyle="h4" marginBottom="0.5rem" color="secondary.700">
          Choose an account to continue to FormSG
        </Text>

        {!profilesResponse.data ? (
          <SkeletonText noOfLines={3} />
        ) : (
          profilesResponse.data?.profiles.map((profile) => (
            <ProfileItem
              profile={profile}
              key={profile.work_email}
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
      <Box flexGrow={1}>
        <Text
          textStyle="subhead-2"
          color="secondary.700"
          marginBottom="0.25rem"
        >
          {profile.work_email}
        </Text>
        <Text
          textStyle="caption-2"
          color="secondary.400"
          marginBottom="0.25rem"
        >
          {[profile.agency_name, profile.department_name].join(', ')}
        </Text>
        <Text textStyle="caption-2" color="secondary.400">
          {profile.employment_title}
        </Text>
      </Box>
      <Box marginLeft="0.5rem">
        <BiChevronRight fontSize="1.5rem" />
      </Box>
    </Flex>
  )
}
