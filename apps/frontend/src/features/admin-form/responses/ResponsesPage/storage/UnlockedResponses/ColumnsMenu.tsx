import { useTranslation } from 'react-i18next'
import { BiColumns } from 'react-icons/bi'
import { MenuButton, MenuList, Stack } from '@chakra-ui/react'

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
  const { columnOptions, hiddenColumnIds, toggleColumnVisibility } =
    useUnlockedResponses()

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
          <MenuList maxH="20rem" overflowY="auto">
            <Stack spacing={0}>
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
