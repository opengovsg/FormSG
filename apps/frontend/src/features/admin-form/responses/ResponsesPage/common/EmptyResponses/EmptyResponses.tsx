import { useTranslation } from 'react-i18next'
import { Flex, Text } from '@chakra-ui/react'

import { OGP_POSTMAN } from '~constants/links'
import Link from '~components/Link'

import { EmptyResponsesSvgr } from './EmptyResponsesSvgr'

export function EmptyResponses(): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex
      flexDir="column"
      justify="center"
      align="center"
      py="4rem"
      px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
      ml={{ base: 0, lg: '-17rem' }}
    >
      <Text as="h2" textStyle="h2" color="primary.500" mb="1rem">
        {t('features.adminForm.responses.responsesPage.emptyResponses.title')}
      </Text>
      <Text textStyle="body-1" color="secondary.500">
        {t(
          'features.adminForm.responses.responsesPage.emptyResponses.subtitle',
          {
            link: (
              <Link isExternal href={OGP_POSTMAN}>
                Postman.gov.sg
              </Link>
            ),
          },
        )}
      </Text>
      <EmptyResponsesSvgr mt="1.5rem" w="280px" maxW="100%" />
    </Flex>
  )
}
