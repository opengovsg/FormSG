import { Helmet } from 'react-helmet-async'
import { Link as ReactLink, useNavigate } from 'react-router-dom'
import { Flex, Stack, Text } from '@chakra-ui/react'

import { AppFooter } from '~/app/AppFooter'

import { useAuth } from '~contexts/AuthContext'
import { ROOT_ROUTE } from '~constants/routes'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import GovtMasthead from '~components/GovtMasthead'

import { ForbiddenSvgr } from './ForbiddenSvgr'

export interface AdminForbidden403PageProps {
  message?: string
}

export const AdminForbidden403Page = ({
  message,
}: AdminForbidden403PageProps): JSX.Element => {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <>
      <Helmet title="Forbidden" />
      <Flex minH="100vh" flexDir="column" h="100%">
        <GovtMasthead />
        <Flex
          justify="center"
          flexDir="column"
          flex={1}
          bgGradient="linear(to-b, primary.500 50%, primary.100 50%)"
        >
          <Flex
            flex={1}
            justify="center"
            align="center"
            flexDir="column"
            p="1.5rem"
          >
            <ForbiddenSvgr maxW="100%" mb="3rem" />
            <Stack
              spacing="2.5rem"
              color="secondary.500"
              align="center"
              textAlign="center"
            >
              <Stack
                spacing="1rem"
                color="secondary.500"
                align="center"
                textAlign="center"
              >
                <Text as="h2" textStyle="h2">
                  You are not authorised to view this page.
                </Text>
                <Text textStyle="body-1">{message}</Text>
              </Stack>
              <Stack
                direction={{ base: 'column', md: 'row' }}
                w="100%"
                justify="center"
              >
                <Button isFullWidth={isMobile} onClick={() => navigate(-1)}>
                  Back
                </Button>
                {isAuthenticated ? (
                  <Button variant="outline" as={ReactLink} to={ROOT_ROUTE}>
                    Go to dashboard
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Flex>
        </Flex>
        <AppFooter />
      </Flex>
    </>
  )
}
