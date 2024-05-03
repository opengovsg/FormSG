import { Helmet } from 'react-helmet-async'
import { Link as ReactLink, useNavigate } from 'react-router-dom'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { Button, Link } from '@opengovsg/design-system-react'

import { AppFooter } from '~/app/AppFooter'

import { useAuth } from '~contexts/AuthContext'
import { DASHBOARD_ROUTE } from '~constants/routes'
import { useIsMobile } from '~hooks/useIsMobile'

import { NotFoundSvgr } from './NotFoundSvgr'

export const NotFoundErrorPage = (): JSX.Element => {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <>
      <Helmet title="Not found" />
      <Flex flex={1} flexDir="column" h="100%">
        <Flex
          justify="center"
          align="center"
          flexDir="column"
          flex={1}
          bgGradient={{
            base: 'linear(to-b, primary.500, primary.500 40%, brand.primary.50 0)',
            md: 'linear(to-b, primary.500 50%, brand.primary.50 50%)',
          }}
          py="3rem"
          px="1.5rem"
        >
          <NotFoundSvgr
            maxW="100%"
            mb={{ base: '1.5rem', md: '3rem' }}
            maxH={{ base: '220px', md: 'initial' }}
          />
          <Stack
            spacing="2.5rem"
            color="brand.secondary.500"
            align="center"
            textAlign="center"
          >
            <Text as="h2" textStyle="h4">
              This page could not be found.
            </Text>
            <Stack
              align="center"
              direction={{ base: 'column', md: 'row' }}
              w="100%"
              justify="center"
            >
              <Button isFullWidth={isMobile} onClick={() => navigate(-1)}>
                Back
              </Button>
              {isAuthenticated ? (
                <Link variant="standalone" as={ReactLink} to={DASHBOARD_ROUTE}>
                  Go to dashboard
                </Link>
              ) : null}
            </Stack>
          </Stack>
        </Flex>
        <Box py={{ lg: '3rem' }} px={{ lg: '9.25rem' }} bg="brand.primary.50">
          <AppFooter variant="compact" />
        </Box>
      </Flex>
    </>
  )
}
