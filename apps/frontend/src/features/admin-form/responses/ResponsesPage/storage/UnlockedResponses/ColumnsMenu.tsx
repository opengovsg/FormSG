import { useTranslation } from 'react-i18next'
import { BiColumns } from 'react-icons/bi'
import { Divider, MenuButton, MenuList, Stack } from '@chakra-ui/react'

import Checkbox from '~components/Checkbox'
import Menu from '~components/Menu'

import { toolbarMenuButtonProps } from './toolbarButtonProps'
import { useUnlockedResponses } from './UnlockedResponsesProvider'

export const ColumnsMenu = ({
  isIconOnly,
}: {
  isIconOnly?: boolean
}): JSX.Element => {
  const { t } = useTranslation()
  const {
    columnOptions,
    hiddenColumnIds,
    toggleColumnVisibility,
    setAllColumnsVisible,
  } = useUnlockedResponses()

  const visibleCount = columnOptions.filter(
    ({ id }) => !hiddenColumnIds.includes(id),
  ).length
  const allSelected =
    columnOptions.length > 0 && visibleCount === columnOptions.length

  return (
    <Menu closeOnSelect={false} placement="bottom-end">
      {({ isOpen }) => (
        <>
          <MenuButton
            variant="clear"
            colorScheme="secondary"
            isActive={isOpen}
            isDisabled={columnOptions.length === 0}
            {...toolbarMenuButtonProps({
              icon: <BiColumns fontSize="1.25rem" />,
              label: t(
                'features.adminForm.responses.responsesPage.storage.unlockedResponses.toolbar.columns',
              ),
              isOpen,
              isIconOnly,
            })}
          />
          <MenuList display="flex" flexDirection="column" maxH="20rem" pb={0}>
            <Stack spacing={0} flex={1} minH={0} overflowY="auto">
              <Checkbox
                px="1rem"
                py="0.75rem"
                isChecked={allSelected}
                isIndeterminate={visibleCount > 0 && !allSelected}
                isDisabled={columnOptions.length === 0}
                onChange={() => setAllColumnsVisible(!allSelected)}
              >
                {t(
                  'features.adminForm.responses.responsesPage.storage.unlockedResponses.toolbar.all',
                )}
              </Checkbox>
              <Divider />
              {columnOptions.map(({ id, label }) => (
                <Checkbox
                  key={id}
                  px="1rem"
                  py="0.75rem"
                  isChecked={!hiddenColumnIds.includes(id)}
                  onChange={() => toggleColumnVisibility(id)}
                >
                  {label}
                </Checkbox>
              ))}
            </Stack>
          </MenuList>
        </>
      )}
    </Menu>
  )
}
