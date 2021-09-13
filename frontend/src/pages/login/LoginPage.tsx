import { FC, useMemo, useState } from 'react'
import { Link as ReactLink } from 'react-router-dom'
import {
  Box,
  chakra,
  Flex,
  Grid,
  GridItem,
  Text,
  useBreakpointValue,
  Wrap,
} from '@chakra-ui/react'

import { ReactComponent as BrandLogoSvg } from '~assets/svgs/brand/brand-hort-colour.svg'
import { ReactComponent as LoginImageSvg } from '~assets/svgs/img-login.svg'
import { FORM_GUIDE, REPORT_VULNERABILITY } from '~constants/externalLinks'
import { LOGGED_IN_KEY } from '~constants/localStorage'
import { LANDING_ROUTE } from '~constants/routes'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { sendLoginOtp, verifyLoginOtp } from '~services/AuthService'
import Footer from '~components/Footer'
import Link from '~components/Link'

import { LoginForm, LoginFormInputs } from './components/LoginForm'
import { OtpForm, OtpFormInputs } from './components/OtpForm'

export type LoginOtpData = {
  email: string
}

const BrandLogo = chakra(BrandLogoSvg, {
  baseStyle: {
    h: { base: '1.5rem', lg: '2rem' },
  },
})
const LoginImage = chakra(LoginImageSvg, {
  baseStyle: {
    maxW: { base: '22rem', lg: '28rem' },
    w: '100%',
  },
})

// Component for the split blue/white background.
const BackgroundBox: FC = ({ children }) => (
  <Box
    flexGrow={1}
    px={{ base: '1.5rem', md: '5.5rem', lg: 0 }}
    bg={{
      base: 'initial',
      md: 'linear-gradient(180deg, var(--chakra-colors-primary-500) 20.625rem, white 0)',
      lg: 'linear-gradient(90deg, var(--chakra-colors-primary-500) 42%, white 0)',
    }}
    children={children}
  />
)

// Component that controls the various grid areas according to responsive breakpoints.
const BaseGridLayout: FC = ({ children }) => (
  <Grid
    minH={{ base: 'initial', lg: '100vh' }}
    maxW="90rem"
    margin="auto"
    templateAreas={{
      base: `'login'`,
      md: `'sidebar' 'login'`,
      lg: `'sidebar login' 'copy links'`,
    }}
    templateRows={{ lg: '1fr auto' }}
    templateColumns={{ lg: '5fr 7fr' }}
    children={children}
  />
)

// Grid area styling for the login form.
const LoginGridArea: FC = ({ children }) => (
  <GridItem
    h={{ base: '100vh', md: '100%' }}
    gridArea="login"
    px={{ base: 0, lg: '7.25rem' }}
    py="4rem"
    d="flex"
    alignItems={{ base: 'initial', lg: 'center' }}
    children={children}
  />
)

// Desktop-only grid area styling for the bottom left area.
const DesktopCopyGridArea: FC = ({ children }) => (
  <GridItem
    display={{ base: 'none', lg: 'initial' }}
    gridArea="copy"
    bg={{ base: 'transparent', lg: 'primary.500' }}
    px={{ base: '1.5rem', lg: '5rem' }}
    pt={0}
    pb="2.5rem"
    children={children}
  />
)

// Desktop-only grid area styling for the bottom right area.
const DesktopLinksGridArea: FC = ({ children }) => (
  <GridItem
    px={{ base: '1.5rem', lg: '7.25rem' }}
    pt={0}
    pb="2.5rem"
    display={{ base: 'none', lg: 'flex' }}
    gridArea="links"
    children={children}
  />
)

// Grid area styling for the left sidebar that only displays on tablet and desktop breakpoints.
const NonMobileSidebarGridArea: FC = ({ children }) => (
  <GridItem
    d={{ base: 'none', md: 'flex' }}
    gridArea="sidebar"
    bg={{ base: 'transparent', lg: 'primary.500' }}
    px={{ base: '1.5rem', lg: '5rem' }}
    pt={{ base: '1.5rem', md: '4rem', lg: '6rem' }}
    pb={{ lg: '3.25rem' }}
    flexDir="column"
    alignItems="center"
    justifyContent="center"
    children={children}
  />
)

export const LoginPage = (): JSX.Element => {
  const [, setIsAuthenticated] = useLocalStorage<boolean>(LOGGED_IN_KEY)
  const [email, setEmail] = useState<string>()

  const currentYear = new Date().getFullYear()
  // `xs` breakpoint needs to be explicitly set, suspect ChakraUI bug where xs
  // breakpoint is smaller than base, so xs defaults to true.
  const isDesktop = useBreakpointValue({ base: false, xs: false, lg: true })

  const footerLinks = useMemo(
    () => [
      { label: 'Contact Us', href: '/contact-us' },
      { label: 'Guide', href: FORM_GUIDE },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms of Use', href: '/terms' },
      {
        label: 'Report Vulnerability',
        href: REPORT_VULNERABILITY,
      },
    ],
    [],
  )

  const handleSendOtp = async ({ email }: LoginFormInputs) => {
    await sendLoginOtp(email)
    return setEmail(email)
  }

  const handleVerifyOtp = async ({ otp }: OtpFormInputs) => {
    // Should not happen, since OtpForm component is only shown when there is
    // already an email state set.
    if (!email) {
      throw new Error('Something went wrong')
    }
    await verifyLoginOtp({ otp, email })
    return setIsAuthenticated(true)
  }

  const handleResendOtp = async () => {
    // Should not happen, since OtpForm component is only shown when there is
    // already an email state set.
    if (!email) {
      throw new Error('Something went wrong')
    }
    await sendLoginOtp(email)
  }

  return (
    <Flex flexDir="column" minH="100vh">
      <BackgroundBox>
        <BaseGridLayout>
          <NonMobileSidebarGridArea>
            <Text
              display={{ base: 'none', lg: 'initial' }}
              textStyle="display-2"
              color="white"
              mb="2.5rem"
            >
              Build secure government forms in minutes
            </Text>
            <LoginImage aria-hidden />
          </NonMobileSidebarGridArea>

          <LoginGridArea>
            <Box
              maxW={{ base: '100%', lg: '28rem' }}
              w="100%"
              minH={{ base: 'auto', lg: '24rem' }}
            >
              <Flex
                pt={{ base: 0, lg: '2rem' }}
                mb={{ base: '2.5rem', lg: 0 }}
                flexDir="column"
              >
                <Link
                  as={ReactLink}
                  to={LANDING_ROUTE}
                  mb={{ base: '0.75rem', lg: '1.5rem' }}
                >
                  <BrandLogo title="FormSG logo" />
                </Link>
                <Text
                  textStyle="h4"
                  color="secondary.500"
                  display={{ base: 'initial', lg: 'none' }}
                >
                  Build secure government forms in minutes
                </Text>
              </Flex>
              {!email ? (
                <LoginForm onSubmit={handleSendOtp} />
              ) : (
                <OtpForm
                  email={email}
                  onSubmit={handleVerifyOtp}
                  onResendOtp={handleResendOtp}
                />
              )}
            </Box>
          </LoginGridArea>

          <DesktopCopyGridArea>
            <Text textStyle="caption-2" color="white">
              © {currentYear} Open Government Products, GovTech Singapore
            </Text>
          </DesktopCopyGridArea>
          <DesktopLinksGridArea>
            <Wrap shouldWrapChildren textStyle="caption-2" spacing="1.5rem">
              {footerLinks.map(({ label, href }, index) => (
                <Link variant="standalone" key={index} href={href}>
                  {label}
                </Link>
              ))}
            </Wrap>
          </DesktopLinksGridArea>
        </BaseGridLayout>
      </BackgroundBox>
      {!isDesktop && (
        <Footer
          appName="Form"
          tagline="Build secure government forms in minutes"
          footerLinks={footerLinks}
        />
      )}
    </Flex>
  )
}
