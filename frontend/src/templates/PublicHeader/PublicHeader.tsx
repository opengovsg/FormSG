import { useBreakpointValue } from '@chakra-ui/media-query'
import { As, chakra, Flex, FlexProps, HStack } from '@chakra-ui/react'

import { ReactComponent as BrandHortSvg } from '~assets/svgs/brand/brand-hort-colour.svg'
import { ReactComponent as BrandMarkSvg } from '~assets/svgs/brand/brand-mark-colour.svg'
import { useIsMobile } from '~hooks/useIsMobile'
import IconButton from '~components/IconButton'
import Link from '~components/Link'

const BrandHortLogo = chakra(BrandHortSvg)
const BrandSmallLogo = chakra(BrandMarkSvg)

type PublicHeaderLinkProps = {
  label: string
  href: string
  showOnMobile?: boolean
  MobileIcon?: As
}

export interface PublicHeaderProps {
  /** Header links to display, if provided. */
  publicHeaderLinks?: PublicHeaderLinkProps[]
  /** Call to action element to render, if any. */
  ctaElement?: React.ReactChild
}

const PublicHeaderLink = ({
  showOnMobile,
  MobileIcon,
  href,
  label,
}: PublicHeaderLinkProps) => {
  const isMobile = useIsMobile()

  if (isMobile && !showOnMobile) {
    return null
  }

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
      color="primary.500"
      href={href}
      aria-label={label}
    >
      {label}
    </Link>
  )
}

export const PublicHeader = ({
  publicHeaderLinks,
  ctaElement: ctaButton,
}: PublicHeaderProps): JSX.Element => {
  const logoToRender = useBreakpointValue(
    {
      base: <BrandSmallLogo w="2.5rem" />,
      sm: <BrandHortLogo w="7.75rem" />,
    },
    { ssr: false },
  )

  return (
    <PublicHeader.Container>
      <Link title="Form Logo" href="https://form.gov.sg/">
        {logoToRender}
      </Link>
      <HStack
        textStyle="subhead-1"
        spacing={{ base: '1rem', md: '2rem', xl: '2.5rem' }}
      >
        {publicHeaderLinks?.map((link, index) => (
          <PublicHeaderLink key={index} {...link} />
        ))}
        {ctaButton ?? null}
      </HStack>
    </PublicHeader.Container>
  )
}

interface PublicHeaderContainerProps extends FlexProps {
  children: React.ReactNode
}

PublicHeader.Container = ({
  children,
  ...props
}: PublicHeaderContainerProps): JSX.Element => {
  return (
    <Flex
      justify="space-between"
      align="center"
      px={{ base: '1.5rem', md: '5.5rem', lg: '9.25rem' }}
      py={{ base: '0.625rem', md: '4.5rem' }}
      bg="primary.100"
      {...props}
    >
      {children}
    </Flex>
  )
}
