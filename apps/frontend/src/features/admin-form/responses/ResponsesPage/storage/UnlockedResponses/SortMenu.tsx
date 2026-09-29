import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiSortAlt2 } from 'react-icons/bi'
import { Box, MenuButton, MenuList, Select, Text } from '@chakra-ui/react'

import Menu from '~components/Menu'

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

  const [draftColumnId, setDraftColumnId] = useState(sortColumnId ?? '')
  const [draftDirection, setDraftDirection] =
    useState<ResponseSortDirection>(sortDirection)

  useEffect(() => setDraftColumnId(sortColumnId ?? ''), [sortColumnId])
  useEffect(() => setDraftDirection(sortDirection), [sortDirection])

  const commitSort = useCallback(() => {
    if (
      draftColumnId === (sortColumnId ?? '') &&
      draftDirection === sortDirection
    ) {
      return
    }
    setSort(draftColumnId || undefined, draftDirection)
  }, [draftColumnId, draftDirection, setSort, sortColumnId, sortDirection])

  return (
    <Menu closeOnSelect={false} placement="bottom-start" onClose={commitSort}>
      {({ isOpen }) => (
        <>
          <MenuButton
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
          <MenuList minW="18rem">
            <SectionLabel>{column}</SectionLabel>
            <Box px="1rem" py="0.75rem">
              <Select
                value={draftColumnId}
                onChange={(event) => setDraftColumnId(event.target.value)}
              >
                <option value="">{none}</option>
                {columnOptions.map(({ id, label }) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </Select>
            </Box>

            <SectionLabel>{direction}</SectionLabel>
            <Box px="1rem" py="0.75rem">
              <Select
                value={draftDirection}
                isDisabled={!draftColumnId}
                onChange={(event) =>
                  setDraftDirection(event.target.value as ResponseSortDirection)
                }
              >
                <option value="asc">{ascending}</option>
                <option value="desc">{descending}</option>
              </Select>
            </Box>
          </MenuList>
        </>
      )}
    </Menu>
  )
}
