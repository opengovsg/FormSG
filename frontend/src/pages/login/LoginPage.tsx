import { FC, useState } from 'react'
import { Box, Grid, GridItem, Text, Wrap } from '@chakra-ui/react'

import { ReactComponent as BrandLogo } from '~assets/svgs/brand/brand-hort-colour.svg'
import { ReactComponent as LoginImage } from '~assets/svgs/img-buildscratch.svg'
import { useAuth } from '~contexts/AuthContext'
import Link from '~components/Link'

import { LoginForm, LoginFormInputs } from './components/LoginForm'
import { OtpForm, OtpFormInputs } from './components/OtpForm'

export type LoginOtpData = {
  email: string
}

export const LoginPage: FC = () => {
  const [email, setEmail] = useState<string>()
  const { sendLoginOtp, verifyLoginOtp } = useAuth()

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
    <Box
      px={{ base: 0, lg: '2rem' }}
      // Used to fill in the left padding gap.
      bg={{
        base: 'initial',
        lg: 'linear-gradient(90deg, var(--chakra-colors-primary-500) 50%, white 0)',
      }}
    >
      <Grid
        minH="100vh"
        maxW="90rem"
        margin="auto"
        templateAreas={{
          base: `'login' 'sidebar' 'links' 'copy'`,
          lg: `'sidebar login' 'copy links'`,
        }}
        templateRows={{ lg: '1fr auto' }}
        templateColumns={{ lg: '5fr 7fr' }}
        gap="1rem"
      >
        <GridItem
          gridArea="sidebar"
          bg="primary.500"
          px={{ base: '1.5rem', lg: '5rem' }}
          py={{ base: '1.5rem', lg: '6rem' }}
          d="flex"
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
          <Box maxW="28rem" w="100%">
            <LoginImage aria-hidden />
          </Box>
        </GridItem>

        <GridItem
          h="100%"
          bg="white"
          gridArea="login"
          px={{ base: '1.5rem', lg: '7.25rem' }}
          py={{ base: '1.5rem', lg: '4rem' }}
          d="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            maxW="28rem"
            w="100%"
            minH={{ base: 'auto', lg: '24rem' }}
            pt="2rem"
          >
            <Box mb="1.5rem" w="10.5rem">
              <BrandLogo title="FormSG logo" />
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
        <GridItem
          gridArea="copy"
          bg="primary.500"
          // Remove grid gap on the y-axis
          mt="-1rem"
          px={{ base: '1.5rem', lg: '5rem' }}
          pt="0.5rem"
          pb="4rem"
        >
          <Text textStyle="legal" color="white">
            © 2021 Open Government Products, GovTech Singapore
          </Text>
        </GridItem>
        <GridItem
          bg="white"
          mt="-1rem"
          px={{ base: '1.5rem', lg: '7.25rem' }}
          pt="0.5rem"
          pb="4rem"
          gridArea="links"
        >
          <Wrap shouldWrapChildren textStyle="legal" spacing="1.5rem">
            <Link>Contact Us</Link>
            <Link>Guide</Link>
            <Link>Privacy</Link>
            <Link>Terms of Use</Link>
            <Link>Report Vulnerability</Link>
          </Wrap>
        </GridItem>
      </Grid>
    </Box>
  )
}
