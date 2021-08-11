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
      px="2rem"
      // Used to fill in the left padding gap.
      bg="linear-gradient(90deg, var(--chakra-colors-primary-500) 50%, white 0)"
    >
      <Grid
        minH="100vh"
        maxW="90rem"
        margin="auto"
        templateRows="1fr auto"
        templateColumns="repeat(12, [col-start] 1fr)"
        gap="1rem"
      >
        <GridItem
          gridColumn="col-start / span 5"
          bg="primary.500"
          px="5rem"
          py="6rem"
          d="flex"
          flexDir="column"
          justifyContent="center"
        >
          <Text textStyle="display-2" color="white" mb="2.5rem">
            Build secure government forms in minutes
          </Text>
          <LoginImage aria-hidden />
        </GridItem>

        <GridItem
          h="100%"
          bg="white"
          gridColumn="col-start 6 / -1"
          px="7.25rem"
          py="4rem"
          d="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box maxW="28rem" w="100%" minH="24rem" pt="2rem">
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
          gridColumn="col-start / span 5"
          bg="primary.500"
          // Remove grid gap on the y-axis
          mt="-1rem"
          px="5rem"
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
          px="7.25rem"
          pt="0.5rem"
          pb="4rem"
          gridColumn="col-start 6 / -1"
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
