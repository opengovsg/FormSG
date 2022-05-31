import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
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

import { AppFooter } from '~/app/AppFooter'

import { ReactComponent as BrandLogoSvg } from '~assets/svgs/brand/brand-hort-colour.svg'
import { ReactComponent as LoginImageSvg } from '~assets/svgs/img-login.svg'
import { APP_FOOTER_LINKS } from '~constants/externalLinks'
import { LOGGED_IN_KEY } from '~constants/localStorage'
import { LANDING_ROUTE } from '~constants/routes'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { sendLoginOtp, verifyLoginOtp } from '~services/AuthService'
import Link from '~components/Link'

import {
  trackAdminLogin,
  trackAdminLoginFailure,
} from '~features/analytics/AnalyticsService'

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
    maxH: { base: '18.5rem' },
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
    minH={{ base: 'initial', lg: '100%' }}
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
    alignItems={{ base: 'center', lg: 'flex-start' }}
    justifyContent="center"
    children={children}
  />
)

export const LoginPage = (): JSX.Element => {
  const [, setIsAuthenticated] = useLocalStorage<boolean>(LOGGED_IN_KEY)
  const [email, setEmail] = useState<string>()
  const { t } = useTranslation()

  const currentYear = new Date().getFullYear()
  // `xs` breakpoint needs to be explicitly set, suspect ChakraUI bug where xs
  // breakpoint is smaller than base, so xs defaults to true.
  const isDesktop = useBreakpointValue({ base: false, xs: false, lg: true })

  const handleSendOtp = async ({ email }: LoginFormInputs) => {
    const trimmedEmail = email.trim()
    await sendLoginOtp(trimmedEmail)
    return setEmail(trimmedEmail)
  }

  const handleVerifyOtp = async ({ otp }: OtpFormInputs) => {
    // Should not happen, since OtpForm component is only shown when there is
    // already an email state set.
    if (!email) {
      throw new Error('Something went wrong')
    }
    try {
      await verifyLoginOtp({ otp, email })
      trackAdminLogin()
      return setIsAuthenticated(true)
    } catch (error) {
      if (error instanceof Error) {
        trackAdminLoginFailure(error.message)
      }
      throw error
    }
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
    <Flex flexDir="column" h="100%">
      <BackgroundBox>
        <BaseGridLayout>
          <NonMobileSidebarGridArea>
            <Text
              display={{ base: 'none', lg: 'initial' }}
              textStyle="display-2"
              color="white"
              mb="2.5rem"
            >
              {t('features.login.LoginPage.slogan')}
            </Text>
            <LoginImage aria-hidden />
          </NonMobileSidebarGridArea>

          <LoginGridArea>
            <Box
              maxW={{ base: '100%', lg: '28rem' }}
              w="100%"
              minH={{ base: 'auto', lg: '17.25rem' }}
            >
              <Flex mb={{ base: '2.5rem', lg: 0 }} flexDir="column">
                <Box>
                  <Link
                    as={ReactLink}
                    to={LANDING_ROUTE}
                    mb={{ base: '0.75rem', lg: '1.5rem' }}
                  >
                    <BrandLogo title="FormSG logo" />
                  </Link>
                </Box>
                <Text
                  textStyle="h4"
                  color="secondary.500"
                  display={{ base: 'initial', lg: 'none' }}
                >
                  {t('features.login.LoginPage.slogan')}
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
              {t('features.login.LoginPage.copyright', { currentYear })}
            </Text>
          </DesktopCopyGridArea>
          <DesktopLinksGridArea>
            <Wrap
              shouldWrapChildren
              textStyle="caption-2"
              spacing={0}
              mx="-0.75rem"
            >
              {APP_FOOTER_LINKS.map(({ label, href }, index) => (
                <Link variant="standalone" key={index} href={href} mx="0.75rem">
                  {label}
                </Link>
              ))}
            </Wrap>
          </DesktopLinksGridArea>
        </BaseGridLayout>
      </BackgroundBox>
      {!isDesktop && <AppFooter />}
    </Flex>
  )
}
