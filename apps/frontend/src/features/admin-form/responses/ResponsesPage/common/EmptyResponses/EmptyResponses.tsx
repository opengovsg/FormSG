import { useTranslation } from 'react-i18next'
import { Flex, Text } from '@chakra-ui/react'

import { responsesPageNs } from '~/i18n/locales/features/admin-form/responses/responses-page'

import { OGP_POSTMAN } from '~constants/links'
import Link from '~components/Link'

import { resultsNavBleed } from '../../../components/FormResultsNavbar'
import { useIsDelightfulDashboard } from '../../../hooks'

import { EmptyResponsesSvgr } from './EmptyResponsesSvgr'

export function EmptyResponses(): JSX.Element {
  const { t } = useTranslation(responsesPageNs)
  const isDelightfulDashboard = useIsDelightfulDashboard()

  if (!isDelightfulDashboard) return <LegacyEmptyResponses />
  return (
    <Flex
      flexDir="column"
      justify="center"
      align="center"
      py="4rem"
      px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
      {...resultsNavBleed}
    >
      <Text as="h2" textStyle="h2" color="primary.500" mb="1rem">
        {t('emptyResponses.title')}
      </Text>
      <Text textStyle="body-1" color="secondary.500">
        {t('emptyResponses.subtitle', {
          link: (
            <Link isExternal href={OGP_POSTMAN}>
              Postman.gov.sg
            </Link>
          ),
        })}
      </Text>
      <EmptyResponsesSvgr mt="1.5rem" w="280px" maxW="100%" />
    </Flex>
  )
}

const LegacyEmptyResponses = (): JSX.Element => {
  const { t } = useTranslation(responsesPageNs)
  return (
    <Flex justify="center" flexDir="column" align="center" px="2rem" py="4rem">
      <Text as="h2" textStyle="h2" color="primary.500" mb="1rem">
        {t('emptyResponses.title')}
      </Text>
      <Text textStyle="body-1" color="secondary.500">
        {t('emptyResponses.subtitle', {
          link: (
            <Link isExternal href={OGP_POSTMAN}>
              Postman.gov.sg
            </Link>
          ),
        })}
      </Text>
      <EmptyResponsesSvgr mt="1.5rem" w="280px" maxW="100%" />
    </Flex>
  )
}
