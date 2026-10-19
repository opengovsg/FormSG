import { useTranslation } from 'react-i18next'
import { BiSave } from 'react-icons/bi'
import { Flex, useBreakpointValue, useDisclosure } from '@chakra-ui/react'

import { MAX_SAVED_VIEWS } from 'formsg-shared/constants'

import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { ColumnsMenu } from './ColumnsMenu'
import { DownloadButton } from './DownloadButton'
import { FilterMenu } from './FilterMenu'
import { matchesSavedView, toSavedViewInput } from './savedViews'
import { SaveViewModal } from './SaveViewModal'
import { SortMenu } from './SortMenu'
import { useUnlockedResponses } from './UnlockedResponsesProvider'
import {
  useSavedViewMutation,
  useUpdateSavedViewMutation,
} from './useSavedViewMutation'

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
  // On a saved view, saving overwrites that view rather than adding one, so
  // only its own contents count as already saved and the limit does not apply.
  const selectedView = savedViews.find(({ _id }) => _id === selectedViewId)
  const isViewSaved = matchesSavedView(
    currentViewState,
    selectedView ? [selectedView] : savedViews,
    columnOptions,
  )
  const isAtViewLimit = !selectedView && savedViews.length >= MAX_SAVED_VIEWS
  const { mutate: createView, isLoading: isCreatingView } =
    useSavedViewMutation()
  const { mutate: updateView, isLoading: isUpdatingView } =
    useUpdateSavedViewMutation()

  const handleSaveView = () => {
    if (!selectedView) {
      saveViewModal.onOpen()
      return
    }
    updateView({
      savedViewId: selectedView._id,
      savedView: toSavedViewInput(
        selectedView.name,
        currentViewState,
        columnOptions,
      ),
    })
  }

  const saveViewButtonProps = {
    variant: 'clear',
    colorScheme: 'secondary',
    isDisabled: isViewSaved || isAtViewLimit,
    isLoading: isCreatingView || isUpdatingView,
    onClick: handleSaveView,
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
      <Flex align="center" justify="space-between" gap="0.75rem" flex={1}>
        <Flex align="center" gap="0.75rem">
          <FilterMenu isIconOnly={isIconOnly} />
          <SortMenu isIconOnly={isIconOnly} />
          <ColumnsMenu isIconOnly={isIconOnly} />
        </Flex>

        <Flex align="center" gap="0.75rem">
          {hasActiveFilters && (
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
          )}
          <DownloadButton isIconOnly={isIconOnly} />
        </Flex>
      </Flex>

      <SaveViewModal
        isOpen={saveViewModal.isOpen}
        onClose={saveViewModal.onClose}
        onSave={(name) =>
          createView(toSavedViewInput(name, currentViewState, columnOptions))
        }
      />
    </Flex>
  )
}
