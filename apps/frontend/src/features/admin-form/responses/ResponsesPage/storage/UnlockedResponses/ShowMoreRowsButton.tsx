import { useTranslation } from 'react-i18next'
import { Flex } from '@chakra-ui/react'

import Button from '~components/Button'

import { useUnlockedResponses } from './UnlockedResponsesProvider'

// Rows are revealed on click rather than on scroll, so the table ends after
// each chunk and its horizontal scrollbar stays within reach of a mouse.
export const ShowMoreRowsButton = (): JSX.Element | null => {
  const { t } = useTranslation()
  const { isTableLoading, renderLimit, renderedRowCount, showMoreRows } =
    useUnlockedResponses()

  if (isTableLoading || renderedRowCount <= renderLimit) return null

  return (
    <Flex justify="center" w="100%">
      <Button variant="outline" onClick={showMoreRows}>
        {t(
          'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.showMore',
        )}
      </Button>
    </Flex>
  )
}
