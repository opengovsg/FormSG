import React, { useEffect, useMemo } from 'react'
import { BiCommentDetail } from 'react-icons/bi'
import { Link as ReactLink } from 'react-router-dom'
import {
  As,
  chakra,
  Flex,
  FlexProps,
  HStack,
  useDisclosure,
} from '@chakra-ui/react'

import { BxsHelpCircle } from '~assets/icons/BxsHelpCircle'
import { ReactComponent as BrandMarkSvg } from '~assets/svgs/brand/brand-mark-colour.svg'
import { FEATURE_REQUEST, FORM_GUIDE } from '~constants/links'
import {
  EMERGENCY_CONTACT_KEY_PREFIX,
  ROLLOUT_ANNOUNCEMENT_KEY_PREFIX,
} from '~constants/localStorage'
import { useIsMobile } from '~hooks/useIsMobile'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { logout } from '~services/AuthService'
import IconButton from '~components/IconButton'
import Link from '~components/Link'
import { AvatarMenu, AvatarMenuDivider } from '~templates/AvatarMenu/AvatarMenu'

import { EmergencyContactModal } from '~features/user/emergency-contact/EmergencyContactModal'
import { useUser } from '~features/user/queries'

import Menu from '../../components/Menu'

const BrandSmallLogo = chakra(BrandMarkSvg)

type AdminNavBarLinkProps = {
  label: string
  href: string
  MobileIcon?: As
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

const AdminNavBarLink = ({ MobileIcon, href, label }: AdminNavBarLinkProps) => {
  const isMobile = useIsMobile()

  if (isMobile && MobileIcon) {
    return (
      <IconButton
        variant="clear"
        as="a"
        href={href}
        aria-label={label}
        icon={<MobileIcon fontSize="1.25rem" color="primary.500" />}
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
    >
      {label}
    </Link>
  )
}

export interface AdminNavBarProps {
  /* This prop is only for testing to show expanded menu state */
  isMenuOpen?: boolean
}

export const AdminNavBar = ({ isMenuOpen }: AdminNavBarProps): JSX.Element => {
  const { user, removeQuery } = useUser()

  const ROLLOUT_ANNOUNCEMENT_KEY = useMemo(
    () => ROLLOUT_ANNOUNCEMENT_KEY_PREFIX + user?._id,
    [user],
  )
  const [hasSeenAnnouncement] = useLocalStorage<boolean>(
    ROLLOUT_ANNOUNCEMENT_KEY,
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
    useLocalStorage<boolean>(emergencyContactKey)

  const {
    isOpen: isContactModalOpen,
    onClose: onContactModalClose,
    onOpen: onContactModalOpen,
  } = useDisclosure({
    onClose: () => {
      setHasSeenContactModal(true)
    },
  })

  // Emergency contact modal appears after the rollout announcement modal
  useEffect(() => {
    if (!hasSeenContactModal && user && !user?.contact && hasSeenAnnouncement) {
      onContactModalOpen()
    }
  }, [hasSeenContactModal, onContactModalOpen, user, hasSeenAnnouncement])

  const handleLogout = () => {
    logout()
    removeQuery()
    if (emergencyContactKey) {
      localStorage.removeItem(emergencyContactKey)
    }
  }

  return (
    <>
      <AdminNavBar.Container>
        <Link title="Form Logo" href={window.location.origin}>
          {<BrandSmallLogo w="2rem" />}
        </Link>
        <HStack
          textStyle="subhead-1"
          spacing={{ base: '0.75rem', md: '1.5rem' }}
        >
          {NAV_LINKS.map((link, index) => (
            <AdminNavBarLink key={index} {...link} />
          ))}
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
            <AvatarMenuDivider />
            <Menu.Item onClick={handleLogout}>Log out</Menu.Item>
          </AvatarMenu>
        </HStack>
      </AdminNavBar.Container>
      <EmergencyContactModal
        onClose={onContactModalClose}
        isOpen={isContactModalOpen}
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
