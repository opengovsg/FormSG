import { useTranslation } from 'react-i18next'
import { BiFilterAlt } from 'react-icons/bi'
import { MenuButton, MenuList, Stack } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import Menu from '~components/Menu'

import { useUnlockedResponses } from './UnlockedResponsesProvider'

export const FilterMenu = (): JSX.Element => {
  const { t } = useTranslation()
  const { columnOptions, excludedSearchColumnIds, toggleSearchColumn } =
    useUnlockedResponses()

  return (
    <Menu closeOnSelect={false} placement="bottom-start">
      {({ isOpen }) => (
        <>
          <MenuButton
            as={Button}
            variant="clear"
            colorScheme="secondary"
            isActive={isOpen}
            isDisabled={columnOptions.length === 0}
            leftIcon={<BiFilterAlt fontSize="1.25rem" />}
            rightIcon={isOpen ? <BxsChevronUp /> : <BxsChevronDown />}
          >
            {t(
              'features.adminForm.responses.responsesPage.storage.unlockedResponses.toolbar.filter',
            )}
          </MenuButton>
          <MenuList maxH="20rem" overflowY="auto">
            <Stack spacing={0}>
              {columnOptions.map(({ id, label }) => (
                <Checkbox
                  key={id}
                  px="1rem"
                  py="0.75rem"
                  isChecked={!excludedSearchColumnIds.includes(id)}
                  onChange={() => toggleSearchColumn(id)}
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
