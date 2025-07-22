import { Helmet } from 'react-helmet-async'
import { Link as ReactLink, useNavigate } from 'react-router-dom'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'

import { AppFooter } from '~/app/AppFooter'

import { useAuth } from '~contexts/AuthContext'
import { DASHBOARD_ROUTE, LOGIN_ROUTE } from '~constants/routes'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import Link from '~components/Link'

import { ForbiddenSvgr } from './ForbiddenSvgr'
import { useTranslation } from 'react-i18next'


export interface AdminForbiddenErrorPageProps {
  message?: string
}

export const AdminForbiddenErrorPage = ({
  message,
}: AdminForbiddenErrorPageProps): JSX.Element => {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation()


  return (
    <>
      <Helmet title="Forbidden" />
      <Flex flex={1} flexDir="column" h="100%">
        <Flex
          justify="center"
          align="center"
          flexDir="column"
          flex={1}
          bgGradient={{
            base: 'linear(to-b, primary.500, primary.500 40%, primary.100 0)',
            md: 'linear(to-b, primary.500 50%, primary.100 50%)',
          }}
          py="3rem"
          px="1.5rem"
        >
          <ForbiddenSvgr
            maxW="100%"
            mb={{ base: '1.5rem', md: '3rem' }}
            maxH={{ base: '220px', md: 'initial' }}
          />
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
                t('features["admin-form"].adminForbiddenErrorPage.title')
              </Text>
              <Text textStyle="body-1">
                {isAuthenticated
                  ? message
                  : message ??  t('features["admin-form"].adminForbiddenErrorPage.message')}
            
              </Text>
            </Stack>
            <Stack
              spacing="1rem"
              align="center"
              direction={{ base: 'column', md: 'row' }}
              w="100%"
              justify="center"
            >
              <Button isFullWidth={isMobile} onClick={() => navigate(-1)}>
                {t('features["admin-form"].adminForbiddenErrorPage.button.text.back')}
            
              </Button>

              <Link
                variant="standalone"
                as={ReactLink}
                to={isAuthenticated ? DASHBOARD_ROUTE : LOGIN_ROUTE}
              >
                {isAuthenticated 
                ? t('features["admin-form"].adminForbiddenErrorPage.button.text.goToDashboard')
                : t('features["admin-form"].adminForbiddenErrorPage.button.text.login')}
              </Link>
            </Stack>
          </Stack>
        </Flex>
        <Box py={{ lg: '3rem' }} px={{ lg: '9.25rem' }} bg="primary.100">
          <AppFooter variant="compact" />
        </Box>
      </Flex>
    </>
  )
}
