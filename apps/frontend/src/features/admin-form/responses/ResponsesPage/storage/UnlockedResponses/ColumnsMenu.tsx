import { useTranslation } from 'react-i18next'
import { BiColumns } from 'react-icons/bi'
import { MenuButton, MenuList, Stack } from '@chakra-ui/react'

import Checkbox from '~components/Checkbox'
import Menu from '~components/Menu'

import { CheckAllFooter } from './CheckAllFooter'
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
            <CheckAllFooter
              onCheckAll={() => setAllColumnsVisible(true)}
              onUncheckAll={() => setAllColumnsVisible(false)}
            />
          </MenuList>
        </>
      )}
    </Menu>
  )
}
