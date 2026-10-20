import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiFilterAlt } from 'react-icons/bi'
import {
  Box,
  Divider,
  MenuButton,
  MenuList,
  Stack,
  Text,
} from '@chakra-ui/react'

import { DateString } from 'formsg-shared/types'

import Button from '~components/Button'
import {
  DateRangePicker,
  dateRangePickerHelper,
} from '~components/DateRangePicker'
import Menu from '~components/Menu'

import { useStorageResponsesContext } from '../StorageResponsesContext'

import { useToolbarMenuDisclosure } from './hooks/useToolbarMenuDisclosure'
import { ColumnFilterRow } from './ColumnFilterRow'
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
  const { t } = useTranslation()
  const {
    dateRange: dateRangeLabel,
    columns: columnsLabel,
    clearAllFilters: clearAllFiltersLabel,
  } = t(
    'features.adminForm.responses.responsesPage.storage.unlockedResponses.filterMenu',
    { returnObjects: true },
  )
  const { columnOptions, columnFilters, setColumnFilter, clearColumnFilters } =
    useUnlockedResponses()
  const [openColumnId, setOpenColumnId] = useState<string>()
  const { dateRange, setDateRange } = useStorageResponsesContext()

  const [draftDateRange, setDraftDateRange] = useState(dateRange)

  useEffect(() => setDraftDateRange(dateRange), [dateRange])

  const { isOpen, onOpen, onClose, buttonRef, listRef } =
    useToolbarMenuDisclosure({
      onClose: () => {
        setDraftDateRange(dateRange)
        setOpenColumnId(undefined)
      },
    })

  const hasFilters = dateRange.length > 0 || columnFilters.length > 0

  const handleClearAllFilters = () => {
    setOpenColumnId(undefined)
    clearColumnFilters()
    setDraftDateRange([])
    setDateRange([])
  }

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
              label: t(
                'features.adminForm.responses.responsesPage.storage.unlockedResponses.toolbar.filter',
              ),
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

              <SectionLabel>{columnsLabel}</SectionLabel>
              <Stack spacing={0} pt="0.5rem" pb="0.5rem">
                {columnOptions.map(({ id, label }) => (
                  <ColumnFilterRow
                    key={id}
                    label={label}
                    text={
                      columnFilters.find(({ columnId }) => columnId === id)
                        ?.text ?? ''
                    }
                    isOpen={openColumnId === id}
                    onOpen={() => setOpenColumnId(id)}
                    onClose={() =>
                      setOpenColumnId((current) =>
                        current === id ? undefined : current,
                      )
                    }
                    onFilter={(text) => setColumnFilter(id, text)}
                  />
                ))}
              </Stack>
            </Box>
            {hasFilters && (
              <>
                <Divider />
                <Box px="1rem" py="0.75rem">
                  <Button variant="clear" onClick={handleClearAllFilters}>
                    {clearAllFiltersLabel}
                  </Button>
                </Box>
              </>
            )}
          </MenuList>
        </>
      )}
    </Menu>
  )
}
