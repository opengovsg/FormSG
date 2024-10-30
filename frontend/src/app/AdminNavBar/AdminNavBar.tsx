import React, { useCallback, useEffect, useMemo } from 'react'
import { BiCommentDetail } from 'react-icons/bi'
import { GoDotFill } from 'react-icons/go'
import { Link as ReactLink } from 'react-router-dom'
import {
  As,
  Box,
  chakra,
  Flex,
  FlexProps,
  HStack,
  Icon,
  useDisclosure,
} from '@chakra-ui/react'

import { SeenFlags } from '~shared/types'

import { BxsHelpCircle } from '~assets/icons/BxsHelpCircle'
import { BxsRocket } from '~assets/icons/BxsRocket'
import BrandMarkSvg from '~assets/svgs/brand/brand-mark-colour.svg?react'
import { FEATURE_REQUEST, FORM_GUIDE } from '~constants/links'
import {
  EMERGENCY_CONTACT_KEY_PREFIX,
  ROLLOUT_ANNOUNCEMENT_KEY_PREFIX,
} from '~constants/localStorage'
import { DASHBOARD_ROUTE } from '~constants/routes'
import { ADMIN_FEEDBACK_SESSION_KEY } from '~constants/sessionStorage'
import { useIsMobile } from '~hooks/useIsMobile'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { logout } from '~services/AuthService'
import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Link from '~components/Link'
import { AvatarMenu, AvatarMenuDivider } from '~templates/AvatarMenu/AvatarMenu'

import { SeenFlagsMapVersion } from '~features/user/constants'
import { EmergencyContactModal } from '~features/user/emergency-contact/EmergencyContactModal'
import { useUserMutations } from '~features/user/mutations'
import { useUser } from '~features/user/queries'
import { TransferOwnershipModal } from '~features/user/transfer-ownership/TransferOwnershipModal'
import { getShowFeatureFlagLastSeen } from '~features/user/utils'
import { WhatsNewDrawer } from '~features/whats-new/WhatsNewDrawer'

import Menu from '../../components/Menu'

const BrandSmallLogo = chakra(BrandMarkSvg)

type AdminNavBarLinkProps = {
  label: string
  href: string
  MobileIcon: As
}

const NAV_LINKS: AdminNavBarLinkProps[] = [
  {
    label: 'Feature request',
    href: FEATURE_REQUEST,
    MobileIcon: BiCommentDetail,
  },
  {
    label: 'Help',
    href: FORM_GUIDE,
    MobileIcon: BxsHelpCircle,
  },
]

const WHATS_NEW_LABEL = "What's new"

const AdminNavBarLink = ({ MobileIcon, href, label }: AdminNavBarLinkProps) => {
  const isMobile = useIsMobile()

  if (isMobile && MobileIcon) {
    return (
      <IconButton
        variant="clear"
        as="a"
        href={href}
        aria-label={label}
        icon={<Icon as={MobileIcon} fontSize="1.25rem" color="primary.500" />}
      />
    )
  }

  return (
    <Link
      w="fit-content"
      variant="standalone"
      color="secondary.500"
      href={href}
      aria-label={label}
      target="_blank"
    >
      {label}
    </Link>
  )
}

interface WhatsNewNavBarTabProps {
  onClick: () => void
  shouldShowNotiifcation: boolean
}

const WhatsNewNavBarTab = ({
  onClick,
  shouldShowNotiifcation,
}: WhatsNewNavBarTabProps) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Box position="relative">
        <IconButton
          variant="clear"
          aria-label={WHATS_NEW_LABEL}
          icon={<BxsRocket fontSize="1.25rem" color="primary.500" />}
          onClick={onClick}
        />
        {shouldShowNotiifcation && (
          <Icon
            as={GoDotFill}
            color="danger.500"
            position="absolute"
            ml="-15px"
          />
        )}
      </Box>
    )
  }

  return (
    <Box position="relative">
      <Button
        w="fit-content"
        variant="link"
        color="secondary.500"
        onClick={onClick}
        aria-label={WHATS_NEW_LABEL}
        fontWeight="500"
      >
        {WHATS_NEW_LABEL}
      </Button>
      {shouldShowNotiifcation && (
        <Icon as={GoDotFill} color="danger.500" position="absolute" ml="-5px" />
      )}
    </Box>
  )
}

export interface AdminNavBarProps {
  /* This prop is only for testing to show expanded menu state */
  isMenuOpen?: boolean
}

export const AdminNavBar = ({ isMenuOpen }: AdminNavBarProps): JSX.Element => {
  const { user, isLoading: isUserLoading, removeQuery } = useUser()
  const { updateLastSeenFlagMutation } = useUserMutations()

  const whatsNewFeatureDrawerDisclosure = useDisclosure()

  const ROLLOUT_ANNOUNCEMENT_KEY = useMemo(
    () => ROLLOUT_ANNOUNCEMENT_KEY_PREFIX + user?._id,
    [user],
  )
  const [hasSeenAnnouncement] = useLocalStorage<boolean>(
    ROLLOUT_ANNOUNCEMENT_KEY,
    false,
  )

  // Only want to show the emergency contact modal if user id exists but user has no emergency contact
  const emergencyContactKey = useMemo(
    () =>
      user && user._id && !user.contact
        ? EMERGENCY_CONTACT_KEY_PREFIX + user._id
        : null,
    [user],
  )

  const [hasSeenContactModal, setHasSeenContactModal] =
    useLocalStorage<boolean>(emergencyContactKey, false)

  const {
    isOpen: isContactModalOpen,
    onClose: onContactModalClose,
    onOpen: onContactModalOpen,
  } = useDisclosure({
    onClose: () => {
      setHasSeenContactModal(true)
    },
  })

  const {
    isOpen: isTransferOwnershipModalOpen,
    onClose: onTransferOwnershipModalClose,
    onOpen: onTransferOwnershipModalOpen,
  } = useDisclosure()

  const shouldShowFeatureUpdateNotification = useMemo(() => {
    if (isUserLoading || !user) return false
    return getShowFeatureFlagLastSeen(
      user,
      SeenFlags.LastSeenFeatureUpdateVersion,
    )
  }, [isUserLoading, user])

  const onWhatsNewDrawerOpen = useCallback(() => {
    if (isUserLoading || !user) return
    if (shouldShowFeatureUpdateNotification) {
      updateLastSeenFlagMutation.mutateAsync({
        version: SeenFlagsMapVersion.lastSeenFeatureUpdateVersion,
        flag: SeenFlags.LastSeenFeatureUpdateVersion,
      })
    }
    whatsNewFeatureDrawerDisclosure.onOpen()
  }, [
    isUserLoading,
    updateLastSeenFlagMutation,
    user,
    whatsNewFeatureDrawerDisclosure,
    shouldShowFeatureUpdateNotification,
  ])

  // Emergency contact modal appears after the rollout announcement modal
  useEffect(() => {
    if (
      hasSeenContactModal === false &&
      user &&
      !user.contact &&
      hasSeenAnnouncement === true
    ) {
      onContactModalOpen()
    }
  }, [hasSeenContactModal, onContactModalOpen, user, hasSeenAnnouncement])

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem(ADMIN_FEEDBACK_SESSION_KEY)
    logout()
    removeQuery()
    if (emergencyContactKey) {
      localStorage.removeItem(emergencyContactKey)
    }
  }, [emergencyContactKey, removeQuery])

  return (
    <>
      <AdminNavBar.Container>
        <ReactLink title="Form Logo" to={DASHBOARD_ROUTE}>
          {<BrandSmallLogo w="2rem" />}
        </ReactLink>
        <HStack
          textStyle="subhead-1"
          spacing={{ base: '0.75rem', md: '1.5rem' }}
        >
          {NAV_LINKS.map((link, index) => (
            <AdminNavBarLink key={index} {...link} />
          ))}
          <WhatsNewNavBarTab
            onClick={onWhatsNewDrawerOpen}
            shouldShowNotiifcation={shouldShowFeatureUpdateNotification}
          />
          <AvatarMenu
            name={user?.email}
            menuUsername={user?.email}
            defaultIsOpen={isMenuOpen}
            menuListProps={{ maxWidth: '19rem' }}
          >
            <Menu.Item as={ReactLink} to="/billing">
              Billing
            </Menu.Item>
            <Menu.Item onClick={onContactModalOpen}>
              Emergency contact
            </Menu.Item>
            <Menu.Item onClick={onTransferOwnershipModalOpen}>
              Transfer all forms
            </Menu.Item>
            <AvatarMenuDivider />
            <Menu.Item onClick={handleLogout}>Log out</Menu.Item>
          </AvatarMenu>
        </HStack>
      </AdminNavBar.Container>
      <WhatsNewDrawer
        isOpen={whatsNewFeatureDrawerDisclosure.isOpen}
        onClose={whatsNewFeatureDrawerDisclosure.onClose}
      />
      <EmergencyContactModal
        onClose={onContactModalClose}
        isOpen={isContactModalOpen}
      />
      <TransferOwnershipModal
        onClose={onTransferOwnershipModalClose}
        isOpen={isTransferOwnershipModalOpen}
      />
    </>
  )
}

interface AdminNavBarContainerProps extends FlexProps {
  children: React.ReactNode
}

AdminNavBar.Container = ({
  children,
  ...props
}: AdminNavBarContainerProps): JSX.Element => {
  return (
    <Flex
      justify="space-between"
      align="center"
      px={{ base: '1.5rem', md: '1.8rem', xl: '2rem' }}
      py="0.75rem"
      bg="white"
      borderBottom="1px"
      borderBottomColor="neutral.300"
      {...props}
    >
      {children}
    </Flex>
  )
}
