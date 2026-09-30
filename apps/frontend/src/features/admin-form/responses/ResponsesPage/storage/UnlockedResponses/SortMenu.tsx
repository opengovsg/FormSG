import { useTranslation } from 'react-i18next'
import { BiSortAlt2 } from 'react-icons/bi'
import { Box, MenuButton, MenuList, Text } from '@chakra-ui/react'

import { SingleSelect } from '~components/Dropdown'
import Menu from '~components/Menu'

import { useToolbarMenuDisclosure } from './hooks/useToolbarMenuDisclosure'
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
  const { column, direction, none, ascending, descending } = t(
    'features.adminForm.responses.responsesPage.storage.unlockedResponses.sortMenu',
    { returnObjects: true },
  )
  const { columnOptions, sortColumnId, sortDirection, setSort } =
    useUnlockedResponses()
  const { isOpen, onOpen, onClose, buttonRef, listRef } =
    useToolbarMenuDisclosure()

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
            items={columnOptions.map(({ id, label }) => ({
              value: id,
              label,
            }))}
            value={sortColumnId ?? ''}
            placeholder={none}
            onChange={(columnId) =>
              setSort(columnId || undefined, sortDirection)
            }
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
            isDisabled={!sortColumnId}
            isClearable={false}
            isSearchable={false}
            onChange={(nextDirection) =>
              setSort(sortColumnId, nextDirection as ResponseSortDirection)
            }
          />
        </Box>
      </MenuList>
    </Menu>
  )
}
