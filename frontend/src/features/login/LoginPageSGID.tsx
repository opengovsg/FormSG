import { FC, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BiLogInCircle } from 'react-icons/bi'
import { useMutation, useQuery } from 'react-query'
import { Link as ReactLink, useSearchParams } from 'react-router-dom'
import { Box, chakra, Flex, GridItem, GridProps, Text } from '@chakra-ui/react'

import { AppFooter } from '~/app/AppFooter'

import { ReactComponent as BrandLogoSvg } from '~assets/svgs/brand/brand-hort-colour.svg'
import { LOGGED_IN_KEY } from '~constants/localStorage'
import { LANDING_PAYMENTS_ROUTE, LANDING_ROUTE } from '~constants/routes'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { getBannerProps } from '~utils/getBannerProps'
import { ApiService } from '~services/ApiService'
import { Banner } from '~components/Banner'
import Button from '~components/Button'
import { FeatureBanner } from '~components/FeatureBanner/FeatureBanner'
import Link from '~components/Link'
import { AppGrid } from '~templates/AppGrid'

import { useEnv } from '~features/env/queries'

import { LoginImageSvgr } from './components/LoginImageSvgr'

export type LoginOtpData = {
  email: string
}

const BrandLogo = chakra(BrandLogoSvg, {
  baseStyle: {
    h: { base: '1.5rem', lg: '2rem' },
  },
})

// Component for the split blue/white background.
const BackgroundBox: FC = ({ children }) => (
  <Flex
    flex={1}
    overflow={{ lg: 'auto' }}
    flexDir="column"
    h="inherit"
    bgGradient={{
      md: 'linear(to-b, primary.500 20.5rem, white 0)',
      lg: 'linear(to-r, primary.500 calc(41.6667% - 4px), white 0)',
    }}
    children={children}
  />
)

// Component that controls the various grid areas according to responsive breakpoints.
const BaseGridLayout = (props: GridProps) => (
  <AppGrid templateRows={{ md: 'auto 1fr auto', lg: '1fr auto' }} {...props} />
)

// Grid area styling for the login form.
const LoginGridArea: FC = ({ children }) => (
  <GridItem
    gridColumn={{ base: '1 / 5', md: '2 / 12', lg: '7 / 12' }}
    py="4rem"
    d="flex"
    alignItems={{ base: 'initial', lg: 'center' }}
    justifyContent="center"
    children={children}
  />
)

// Grid area styling for the footer.
const FooterGridArea: FC = ({ children }) => (
  <GridItem
    alignSelf="end"
    gridColumn={{ base: '1 / 5', md: '2 / 12' }}
    pb={{ base: 0, lg: '2.5rem' }}
    bg={{ base: 'primary.100', lg: 'transparent' }}
    children={children}
  />
)

// Grid area styling for the left sidebar that only displays on tablet and desktop breakpoints.
const NonMobileSidebarGridArea: FC = ({ children }) => (
  <GridItem
    d={{ base: 'none', md: 'flex' }}
    gridColumn={{ md: '1 / 13', lg: '2 / 6' }}
    // colSpan={{ md: 12, lg: 5 }}
    // pl={{ base: '1.5rem', lg: '8%' }}
    h={{ md: '20.5rem', lg: 'auto' }}
    pt={{ base: '1.5rem', md: '2.5rem', lg: '3rem' }}
    pb={{ lg: '3rem' }}
    flexDir="column"
    alignItems={{ base: 'center', lg: 'flex-end' }}
    justifyContent="center"
    children={children}
  />
)

export const LoginPageSGID = (): JSX.Element => {
  const [params] = useSearchParams()
  console.log(params)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  return !params.size ? <LoginPageSGIDPage /> : <LoginViaSGID />
}

export const LoginViaSGID = (): JSX.Element => {
  const [params] = useSearchParams()
  const [, setIsAuthenticated] = useLocalStorage<boolean>(LOGGED_IN_KEY)

  useQuery(
    ['sgid/login'],
    () => ApiService.get(`/auth/sgid/login?${params.toString()}`),
    {
      onSuccess: () => {
        setIsAuthenticated(true)
        window.location.assign('/dashboard')
      },
      retry: false,
    },
  )

  return <></>
}

export const LoginPageSGIDPage = (): JSX.Element => {
  const { data: { siteBannerContent, isLoginBanner } = {} } = useEnv()
  const { t } = useTranslation()

  const bannerContent = useMemo(
    // Use || instead of ?? so that we fall through even if previous banners are empty string.
    () => siteBannerContent || isLoginBanner,
    [siteBannerContent, isLoginBanner],
  )

  const bannerProps = useMemo(
    () => getBannerProps(bannerContent),
    [bannerContent],
  )

  const handleLoginMutation = useMutation(
    () => {
      return ApiService.get<{ redirectUrl: string }>(
        `/auth/sgid/generateAuthUrl`,
      ).then((res) => res.data)
    },
    {
      onSuccess: (data) => {
        window.location.assign(data.redirectUrl)
      },
    },
  )

  const bannerColorIntensity = 600
  const bannerColor = `primary.${bannerColorIntensity}` // So banner colors are different from the blue background (left of login screen).

  return (
    <BackgroundBox>
      {bannerProps ? (
        <Banner
          useMarkdown
          variant={bannerProps.variant}
          bannerColor={bannerColor}
        >
          {bannerProps.msg}
        </Banner>
      ) : null}
      <FeatureBanner
        bannerColorIntensity={bannerColorIntensity}
        body="You can now collect payments directly on your form!"
        learnMoreLink={LANDING_PAYMENTS_ROUTE}
      />
      <BaseGridLayout flex={1}>
        <NonMobileSidebarGridArea>
          <LoginImageSvgr maxW="100%" aria-hidden />
        </NonMobileSidebarGridArea>
        <LoginGridArea>
          <Box minH={{ base: 'auto', lg: '17.25rem' }} w="100%">
            <Flex mb={{ base: '2.5rem', lg: 0 }} flexDir="column">
              <Text
                display={{ base: 'none', lg: 'initial' }}
                textStyle="display-2"
                color="secondary.500"
                mb="2.5rem"
              >
                {t('features.login.LoginPage.slogan')}
              </Text>
              <Box display={{ base: 'initial', lg: 'none' }}>
                <Link
                  as={ReactLink}
                  to={LANDING_ROUTE}
                  mb={{ base: '0.75rem', lg: '1.5rem' }}
                >
                  <BrandLogo title="FormSG logo" />
                </Link>
                <Text textStyle="h4" color="secondary.500">
                  {t('features.login.LoginPage.slogan')}
                </Text>
              </Box>
            </Flex>
            <Button
              rightIcon={<BiLogInCircle fontSize="1.5rem" />}
              onClick={() => handleLoginMutation.mutate()}
              isLoading={false}
            >
              Log in with Singpass app
            </Button>
          </Box>
        </LoginGridArea>
      </BaseGridLayout>
      <BaseGridLayout bg={{ base: 'primary.100', lg: 'transparent' }}>
        <FooterGridArea>
          <AppFooter
            compactMonochromeLogos
            variant="compact"
            containerProps={{
              px: 0,
              bg: 'transparent',
            }}
          />
        </FooterGridArea>
      </BaseGridLayout>
    </BackgroundBox>
  )
}
