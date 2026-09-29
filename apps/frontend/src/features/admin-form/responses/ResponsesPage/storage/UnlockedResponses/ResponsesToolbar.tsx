import { useTranslation } from 'react-i18next'
import { Box, Flex, useDisclosure } from '@chakra-ui/react'

import Button from '~components/Button'

import { ColumnsMenu } from './ColumnsMenu'
import { DownloadButton } from './DownloadButton'
import { FilterMenu } from './FilterMenu'
import { ResponsesSearchbar } from './ResponsesSearchbar'
import { SaveViewModal } from './SaveViewModal'
import { SortMenu } from './SortMenu'

export const ResponsesToolbar = (): JSX.Element => {
  const { t } = useTranslation()
  const { saveAsNewView } = t(
    'features.adminForm.responses.responsesPage.storage.unlockedResponses.views',
    { returnObjects: true },
  )
  const saveViewModal = useDisclosure()

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
        <SortMenu />
        <ColumnsMenu />
      </Flex>

      <Flex align="center" gap="0.75rem" flexShrink={0}>
        <Button
          variant="clear"
          colorScheme="secondary"
          onClick={saveViewModal.onOpen}
        >
          {saveAsNewView}
        </Button>
        <DownloadButton />
      </Flex>

      <SaveViewModal
        isOpen={saveViewModal.isOpen}
        onClose={saveViewModal.onClose}
      />
    </Flex>
  )
}
