import {
  chakra,
  Flex,
  FlexProps,
  HStack,
  useBreakpointValue,
} from '@chakra-ui/react'

import { ReactComponent as BrandHortSvg } from '~assets/svgs/brand/brand-hort-colour.svg'
import { ReactComponent as BrandMarkSvg } from '~assets/svgs/brand/brand-mark-colour.svg'
import Button, { ButtonProps } from '~components/Button'
import Link from '~components/Link'

const BrandHortLogo = chakra(BrandHortSvg)
const BrandSmallLogo = chakra(BrandMarkSvg)

type PublicHeaderLink = {
  label: string
  href: string
  showOnMobile?: boolean
}

export interface PublicHeaderProps {
  /** Footer links to display, if provided. */
  publicHeaderLinks?: PublicHeaderLink[]
  /** Callback invoked when login button is clicked */
  loginButtonProps?: ButtonProps
}

export const PublicHeader = ({
  publicHeaderLinks,
  loginButtonProps,
}: PublicHeaderProps): JSX.Element => {
  const logoToRender = useBreakpointValue({
    base: <BrandSmallLogo w="2.5rem" />,
    sm: <BrandHortLogo w="7.75rem" />,
  })

  return (
    <PublicHeader.Container>
      <Link title="Form Logo" href="https://form.gov.sg/">
        {logoToRender}
      </Link>
      <HStack>
        <HStack
          paddingEnd={{ base: '1.5rem', md: '2rem', xl: '2.5rem' }}
          spacing={{ base: '1.5rem', md: '2rem', xl: '2.5rem' }}
          textStyle="subhead-1"
        >
          {publicHeaderLinks?.map(({ label, href, showOnMobile }, index) => (
            <Link
              display={{ base: showOnMobile ? 'block' : 'none', md: 'block' }}
              w="fit-content"
              variant="standalone"
              color="primary.500"
              key={index}
              href={href}
            >
              {label}
            </Link>
          ))}
        </HStack>
        <Button variant="solid" colorScheme="primary" {...loginButtonProps}>
          Log in
        </Button>
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
      px={{ base: '1.5rem', sm: '5.5rem', xl: '9.25rem' }}
      py={{ base: '0.625rem', sm: '5.5rem', xl: '5.5rem' }}
      bg="primary.100"
      {...props}
    >
      {children}
    </Flex>
  )
}
