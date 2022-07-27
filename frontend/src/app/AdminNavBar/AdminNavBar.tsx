import React, { useMemo, useState } from 'react'
import { BiCommentDetail } from 'react-icons/bi'
import { Link as ReactLink } from 'react-router-dom'
import { As, chakra, Flex, FlexProps, HStack } from '@chakra-ui/react'

import { BxsHelpCircle } from '~assets/icons/BxsHelpCircle'
import { ReactComponent as BrandMarkSvg } from '~assets/svgs/brand/brand-mark-colour.svg'
import { EMERGENCY_CONTACT_KEY_PREFIX } from '~constants/localStorage'
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
    href: 'https://go.gov.sg/form-featurerequest',
    MobileIcon: BiCommentDetail,
  },
  {
    label: 'Help',
    href: 'https://guide.form.gov.sg',
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
  const { user, isLoading: isUserLoading } = useUser()

  const emergencyContactKey = useMemo(
    () =>
      user?._id
        ? user.contact
          ? null
          : EMERGENCY_CONTACT_KEY_PREFIX + user._id
        : null,
    [user],
  )

  const [hasSeenContactModal, setHasSeenContactModal] =
    useLocalStorage<boolean>(emergencyContactKey)

  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false)
  const handleContactModalOpenClick = () => {
    setIsContactModalOpen(true)
  }
  const onEmergencyContactModalClose = () => {
    setIsContactModalOpen(false)
    setHasSeenContactModal(true)
  }

  const isEmergencyContactModalOpenOnLogin = useMemo(
    () => !isUserLoading && !user?.contact && !hasSeenContactModal,
    [isUserLoading, hasSeenContactModal, user],
  )

  const isEmergencyContactModalOpen =
    (isContactModalOpen && Boolean(user)) || isEmergencyContactModalOpenOnLogin

  const handleLogout = () => {
    logout()
    if (emergencyContactKey) {
      localStorage.removeItem(emergencyContactKey)
    }
  }

  return (
    <>
      <AdminNavBar.Container>
        <Link title="Form Logo" href="https://form.gov.sg/">
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
            <Menu.Item onClick={handleContactModalOpenClick}>
              Emergency contact
            </Menu.Item>
            <AvatarMenuDivider />
            <Menu.Item onClick={handleLogout}>Sign out</Menu.Item>
          </AvatarMenu>
        </HStack>
      </AdminNavBar.Container>
      <EmergencyContactModal
        onClose={onEmergencyContactModalClose}
        isOpen={isEmergencyContactModalOpen}
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
