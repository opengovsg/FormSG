import { useTranslation } from 'react-i18next'
import { BiGridAlt, BiSortAlt2 } from 'react-icons/bi'
import { Box, Flex } from '@chakra-ui/react'

import Button from '~components/Button'

import { ColumnsMenu } from './ColumnsMenu'
import { DownloadButton } from './DownloadButton'
import { FilterMenu } from './FilterMenu'
import { ResponsesSearchbar } from './ResponsesSearchbar'

export const ResponsesToolbar = (): JSX.Element => {
  const { t } = useTranslation()
  const { sort, group } = t(
    'features.adminForm.responses.responsesPage.storage.unlockedResponses.toolbar',
    { returnObjects: true },
  )

  return (
    <Flex
      direction={{ base: 'column', lg: 'row' }}
      align={{ base: 'stretch', lg: 'center' }}
      justify="space-between"
      gap="0.75rem"
      w="100%"
      maxW="100%"
      mb="1rem"
      flexShrink={0}
    >
      <Flex align="center" gap="0.75rem" minW={0} flexWrap="wrap">
        <Box w={{ base: '100%', sm: '18rem' }} maxW="100%">
          <ResponsesSearchbar />
        </Box>
        <FilterMenu />
        <Button
          variant="clear"
          colorScheme="secondary"
          leftIcon={<BiSortAlt2 fontSize="1.25rem" />}
        >
          {sort}
        </Button>
        <Button
          variant="clear"
          colorScheme="secondary"
          leftIcon={<BiGridAlt fontSize="1.25rem" />}
        >
          {group}
        </Button>
      </Flex>

      <Flex align="center" gap="0.75rem" flexShrink={0}>
        <ColumnsMenu />
        <DownloadButton />
      </Flex>
    </Flex>
  )
}
