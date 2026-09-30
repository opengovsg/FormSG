import { useTranslation } from 'react-i18next'
import { BiSave } from 'react-icons/bi'
import { Box, Flex, useBreakpointValue, useDisclosure } from '@chakra-ui/react'

import { MAX_SAVED_VIEWS } from 'formsg-shared/constants'

import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { ColumnsMenu } from './ColumnsMenu'
import { DownloadButton } from './DownloadButton'
import { FilterMenu } from './FilterMenu'
import { ResponsesSearchbar } from './ResponsesSearchbar'
import { matchesSavedView, toSavedViewInput } from './savedViews'
import { SaveViewModal } from './SaveViewModal'
import { SortMenu } from './SortMenu'
import { useUnlockedResponses } from './UnlockedResponsesProvider'
import { useSavedViewMutation } from './useSavedViewMutation'

export const ResponsesToolbar = (): JSX.Element => {
  const { t } = useTranslation()
  const { saveView: saveViewLabel, viewLimitReached } = t(
    'features.adminForm.responses.responsesPage.storage.unlockedResponses.views',
    { returnObjects: true },
  )
  const saveViewModal = useDisclosure()
  const isIconOnly =
    useBreakpointValue({ base: true, xl: false }, { ssr: false }) ?? true
  const {
    columnOptions,
    currentViewState,
    hasActiveFilters,
    savedViews,
    selectedViewId,
  } = useUnlockedResponses()
  const isViewSaved = matchesSavedView(
    currentViewState,
    savedViews,
    columnOptions,
  )
  const isAtViewLimit = savedViews.length >= MAX_SAVED_VIEWS
  const { mutate: saveView, isLoading: isSavingView } = useSavedViewMutation()

  const saveViewButtonProps = {
    variant: 'clear',
    colorScheme: 'secondary',
    isDisabled: !hasActiveFilters || isViewSaved || isAtViewLimit,
    isLoading: isSavingView,
    onClick: saveViewModal.onOpen,
  } as const

  return (
    <Flex
      direction={{ base: 'column', lg: 'row' }}
      align={{ base: 'stretch', lg: 'center' }}
      gap="0.75rem"
      w="100%"
      maxW="100%"
      mb="1rem"
      flexShrink={0}
    >
      <Box w={{ base: '100%', lg: '18rem' }} flexShrink={0}>
        <ResponsesSearchbar key={selectedViewId} />
      </Box>

      <Flex align="center" justify="space-between" gap="0.75rem" flex={1}>
        <Flex align="center" gap="0.75rem">
          <FilterMenu isIconOnly={isIconOnly} />
          <SortMenu isIconOnly={isIconOnly} />
          <ColumnsMenu isIconOnly={isIconOnly} />
        </Flex>

        <Flex align="center" gap="0.75rem">
          <Tooltip
            label={viewLimitReached.replace(
              '{MAX_VIEWS}',
              String(MAX_SAVED_VIEWS),
            )}
            isDisabled={!isAtViewLimit}
            shouldWrapChildren
          >
            {isIconOnly ? (
              <IconButton
                {...saveViewButtonProps}
                icon={<BiSave />}
                aria-label={saveViewLabel}
              />
            ) : (
              <Button
                {...saveViewButtonProps}
                leftIcon={<BiSave fontSize="1.25rem" />}
              >
                {saveViewLabel}
              </Button>
            )}
          </Tooltip>
          <DownloadButton isIconOnly={isIconOnly} />
        </Flex>
      </Flex>

      <SaveViewModal
        isOpen={saveViewModal.isOpen}
        onClose={saveViewModal.onClose}
        onSave={(name) =>
          saveView(toSavedViewInput(name, currentViewState, columnOptions))
        }
      />
    </Flex>
  )
}
