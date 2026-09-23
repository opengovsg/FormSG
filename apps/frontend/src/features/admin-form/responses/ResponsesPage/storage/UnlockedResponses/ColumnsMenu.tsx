import { useTranslation } from 'react-i18next'
import { BiColumns } from 'react-icons/bi'
import { MenuButton, MenuList, Stack } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import Menu from '~components/Menu'

import { useUnlockedResponses } from './UnlockedResponsesProvider'

export const ColumnsMenu = (): JSX.Element => {
  const { t } = useTranslation()
  const { columnOptions, hiddenColumnIds, toggleColumnVisibility } =
    useUnlockedResponses()

  return (
    <Menu closeOnSelect={false} placement="bottom-end">
      {({ isOpen }) => (
        <>
          <MenuButton
            as={Button}
            variant="clear"
            colorScheme="secondary"
            isActive={isOpen}
            isDisabled={columnOptions.length === 0}
            leftIcon={<BiColumns fontSize="1.25rem" />}
            rightIcon={isOpen ? <BxsChevronUp /> : <BxsChevronDown />}
          >
            {t(
              'features.adminForm.responses.responsesPage.storage.unlockedResponses.toolbar.columns',
            )}
          </MenuButton>
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
