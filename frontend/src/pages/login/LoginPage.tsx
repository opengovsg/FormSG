import { FC, useMemo, useState } from 'react'
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
import { ReactComponent as LoginImageSvg } from '~assets/svgs/img-buildscratch.svg'
import { useAuth } from '~contexts/AuthContext'
import { FORM_GUIDE, REPORT_VULNERABILITY } from '~constants/externalLinks'
import Footer from '~components/Footer'
import Link from '~components/Link'

import { LoginForm, LoginFormInputs } from './components/LoginForm'
import { OtpForm, OtpFormInputs } from './components/OtpForm'

export type LoginOtpData = {
  email: string
}

const BrandLogo = chakra(BrandLogoSvg)
const LoginImage = chakra(LoginImageSvg)

export const LoginPage: FC = () => {
  const [email, setEmail] = useState<string>()
  const { sendLoginOtp, verifyLoginOtp } = useAuth()

  const currentYear = new Date().getFullYear()
  const isDesktop = useBreakpointValue({ base: false, xs: false, lg: true })
  const isTablet = useBreakpointValue({ base: false, xs: false, md: true })

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

  const handleVerifyOtp = ({ otp }: OtpFormInputs) => {
    // Should not happen, since OtpForm component is only shown when there is
    // already an email state set.
    if (!email) {
      throw new Error('Something went wrong')
    }
    return verifyLoginOtp({ otp, email })
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
      <Box
        flexGrow={1}
        px={{ base: '1.5rem', md: '5.5rem', lg: 0 }}
        bg={{
          base: 'initial',
          md: 'linear-gradient(180deg, var(--chakra-colors-primary-500) 20.625rem, white 0)',
          lg: 'linear-gradient(90deg, var(--chakra-colors-primary-500) 42%, white 0)',
        }}
      >
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
        >
          {isTablet && (
            <GridItem
              d="flex"
              gridArea="sidebar"
              bg={{ base: 'transparent', lg: 'primary.500' }}
              px={{ base: '1.5rem', lg: '5rem' }}
              pt={{ base: '1.5rem', md: '4rem', lg: '6rem' }}
              pb={{ lg: '6rem' }}
              flexDir="column"
              alignItems="center"
              justifyContent="center"
            >
              <Text
                display={{ base: 'none', lg: 'initial' }}
                textStyle="display-2"
                color="white"
                mb="2.5rem"
              >
                Build secure government forms in minutes
              </Text>
              <LoginImage
                aria-hidden
                maxW={{ base: '22rem', lg: '28rem' }}
                w="100%"
              />
            </GridItem>
          )}

          <GridItem
            h="100%"
            gridArea="login"
            px={{ base: 0, lg: '7.25rem' }}
            py="4rem"
            d="flex"
            alignItems={{ base: 'initial', lg: 'center' }}
          >
            <Box
              maxW={{ base: '100%', lg: '28rem' }}
              w="100%"
              minH={{ base: 'auto', lg: '24rem' }}
            >
              <Box pt={{ base: 0, lg: '2rem' }} mb={{ base: '2.5rem', lg: 0 }}>
                <BrandLogo
                  title="FormSG logo"
                  mb={{ base: '0.75rem', lg: '1.5rem' }}
                  h={{ base: '1.5rem', lg: '2rem' }}
                />
                <Text
                  textStyle="h4"
                  color="secondary.500"
                  display={{ base: 'initial', lg: 'none' }}
                >
                  Build secure government forms in minutes
                </Text>
              </Box>
              {!email ? (
                <LoginForm onSubmit={handleSendOtp} />
              ) : (
                <OtpForm
                  onSubmit={handleVerifyOtp}
                  onResendOtp={handleResendOtp}
                />
              )}
            </Box>
          </GridItem>
          {isDesktop && (
            <>
              <GridItem
                gridArea="copy"
                bg={{ base: 'transparent', lg: 'primary.500' }}
                px={{ base: '1.5rem', lg: '5rem' }}
                pt="0.5rem"
                pb="4rem"
              >
                <Text textStyle="legal" color="white">
                  © {currentYear} Open Government Products, GovTech Singapore
                </Text>
              </GridItem>
              <GridItem
                px={{ base: '1.5rem', lg: '7.25rem' }}
                pt="0.5rem"
                pb="4rem"
                display={{ base: 'none', lg: 'flex' }}
                gridArea="links"
              >
                <Wrap shouldWrapChildren textStyle="legal" spacing="1.5rem">
                  {footerLinks.map(({ label, href }, index) => (
                    <Link variant="standalone" key={index} href={href}>
                      {label}
                    </Link>
                  ))}
                </Wrap>
              </GridItem>
            </>
          )}
        </Grid>
      </Box>
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
