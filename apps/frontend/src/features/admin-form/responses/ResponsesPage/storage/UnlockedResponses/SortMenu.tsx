import { useTranslation } from 'react-i18next'
import { BiSortAlt2 } from 'react-icons/bi'
import { Box, MenuButton, MenuList, Text } from '@chakra-ui/react'

import { SingleSelect } from '~components/Dropdown'
import Menu from '~components/Menu'

import { useToolbarMenuDisclosure } from './hooks/useToolbarMenuDisclosure'
import { normaliseSort, RESPONSE_NUMBER_COLUMN_ID } from './savedViews'
import { toolbarMenuButtonProps } from './toolbarButtonProps'
import {
  ResponseSortDirection,
  useUnlockedResponses,
} from './UnlockedResponsesProvider'

const SectionLabel = ({ children }: { children: string }) => (
  <Text textStyle="subhead-3" color="secondary.500" px="1rem" pt="1rem">
    {children}
  </Text>
)

export const SortMenu = ({
  isIconOnly,
}: {
  isIconOnly?: boolean
}): JSX.Element => {
  const { t } = useTranslation()
  const { column, direction, responseNumber, ascending, descending } = t(
    'features.adminForm.responses.responsesPage.storage.unlockedResponses.sortMenu',
    { returnObjects: true },
  )
  const { columnOptions, sortColumnId, sortDirection, setSort } =
    useUnlockedResponses()
  const { isOpen, onOpen, onClose, buttonRef, listRef } =
    useToolbarMenuDisclosure()

  const applySort = (
    columnId: string | undefined,
    nextDirection: ResponseSortDirection,
  ) => {
    const next = normaliseSort(columnId, nextDirection)
    setSort(next.sortColumnId, next.sortDirection)
  }

  return (
    <Menu
      closeOnSelect={false}
      closeOnBlur={false}
      placement="bottom-start"
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
    >
      <MenuButton
        ref={buttonRef}
        variant="clear"
        colorScheme="secondary"
        isActive={isOpen}
        {...toolbarMenuButtonProps({
          icon: <BiSortAlt2 fontSize="1.25rem" />,
          label: t(
            'features.adminForm.responses.responsesPage.storage.unlockedResponses.toolbar.sort',
          ),
          isOpen,
          isIconOnly,
        })}
      />
      <MenuList ref={listRef} minW="18rem">
        <SectionLabel>{column}</SectionLabel>
        <Box px="1rem" py="0.75rem">
          <SingleSelect
            name="sortColumn"
            items={[
              { value: RESPONSE_NUMBER_COLUMN_ID, label: responseNumber },
              ...columnOptions.map(({ id, label }) => ({
                value: id,
                label,
              })),
            ]}
            value={sortColumnId ?? RESPONSE_NUMBER_COLUMN_ID}
            isClearable={false}
            onChange={(columnId) => applySort(columnId, sortDirection)}
          />
        </Box>

        <SectionLabel>{direction}</SectionLabel>
        <Box px="1rem" py="0.75rem">
          <SingleSelect
            name="sortDirection"
            items={[
              { value: 'asc', label: ascending },
              { value: 'desc', label: descending },
            ]}
            value={sortDirection}
            isClearable={false}
            isSearchable={false}
            onChange={(nextDirection) =>
              applySort(
                sortColumnId ?? RESPONSE_NUMBER_COLUMN_ID,
                nextDirection as ResponseSortDirection,
              )
            }
          />
        </Box>
      </MenuList>
    </Menu>
  )
}
