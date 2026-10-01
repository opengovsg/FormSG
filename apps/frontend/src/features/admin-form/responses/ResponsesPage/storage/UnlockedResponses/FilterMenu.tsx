import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiFilterAlt } from 'react-icons/bi'
import {
  Box,
  ButtonGroup,
  Divider,
  MenuButton,
  MenuList,
  Stack,
  Text,
} from '@chakra-ui/react'

import { DateString } from 'formsg-shared/types'

import { responsesPageNs } from '~/i18n/locales/features/admin-form/responses/responses-page'

import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import {
  DateRangePicker,
  dateRangePickerHelper,
} from '~components/DateRangePicker'
import Menu from '~components/Menu'

import { useStorageResponsesContext } from '../StorageResponsesContext'

import { useToolbarMenuDisclosure } from './hooks/useToolbarMenuDisclosure'
import { toolbarMenuButtonProps } from './toolbarButtonProps'
import { useUnlockedResponses } from './UnlockedResponsesProvider'

const SectionLabel = ({ children }: { children: string }) => (
  <Text textStyle="subhead-3" color="secondary.500" px="1rem" pt="1rem">
    {children}
  </Text>
)

export const FilterMenu = ({
  isIconOnly,
}: {
  isIconOnly?: boolean
}): JSX.Element => {
  const { t } = useTranslation(responsesPageNs)
  const {
    dateRange: dateRangeLabel,
    columns,
    checkAll,
    uncheckAll,
  } = t('storage.unlockedResponses.filterMenu', { returnObjects: true })
  const {
    columnOptions,
    excludedSearchColumnIds,
    toggleSearchColumn,
    setAllSearchColumns,
  } = useUnlockedResponses()
  const { dateRange, setDateRange } = useStorageResponsesContext()

  const [draftDateRange, setDraftDateRange] = useState(dateRange)

  useEffect(() => setDraftDateRange(dateRange), [dateRange])

  const { isOpen, onOpen, onClose, buttonRef, listRef } =
    useToolbarMenuDisclosure({
      onClose: () => setDraftDateRange(dateRange),
    })

  const handleDateRangeChange = (nextDateRange: DateString[]) => {
    setDraftDateRange(nextDateRange)
    if (nextDateRange.length === 0 || nextDateRange.length === 2) {
      setDateRange(nextDateRange)
    }
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
      {() => (
        <>
          <MenuButton
            ref={buttonRef}
            variant="clear"
            colorScheme="secondary"
            isActive={isOpen}
            {...toolbarMenuButtonProps({
              icon: <BiFilterAlt fontSize="1.25rem" />,
              label: t('storage.unlockedResponses.toolbar.filter'),
              isOpen,
              isIconOnly,
            })}
          />
          <MenuList
            ref={listRef}
            display="flex"
            flexDirection="column"
            maxH="28rem"
            minW="20rem"
            pb={0}
          >
            <Box flex={1} minH={0} overflowY="auto">
              <SectionLabel>{dateRangeLabel}</SectionLabel>
              <Box px="1rem" py="0.75rem">
                <DateRangePicker
                  value={dateRangePickerHelper.dateStringToDatePickerValue(
                    draftDateRange,
                  )}
                  onChange={(nextDateRange) =>
                    handleDateRangeChange(
                      dateRangePickerHelper.datePickerValueToDateString(
                        nextDateRange,
                      ),
                    )
                  }
                />
              </Box>

              <SectionLabel>{columns}</SectionLabel>
              <Stack spacing={0}>
                {columnOptions.map(({ id, label }) => (
                  <Checkbox
                    key={id}
                    px="1rem"
                    py="0.5rem"
                    isChecked={!excludedSearchColumnIds.includes(id)}
                    onChange={() => toggleSearchColumn(id)}
                  >
                    {label}
                  </Checkbox>
                ))}
              </Stack>
            </Box>
            <Divider />
            <ButtonGroup px="1rem" py="0.75rem" spacing="0.5rem">
              <Button variant="clear" onClick={() => setAllSearchColumns(true)}>
                {checkAll}
              </Button>
              <Button
                variant="clear"
                onClick={() => setAllSearchColumns(false)}
              >
                {uncheckAll}
              </Button>
            </ButtonGroup>
          </MenuList>
        </>
      )}
    </Menu>
  )
}
