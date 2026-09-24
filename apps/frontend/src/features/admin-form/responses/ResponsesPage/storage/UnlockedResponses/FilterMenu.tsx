import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiFilterAlt } from 'react-icons/bi'
import {
  Box,
  ButtonGroup,
  MenuButton,
  MenuList,
  Stack,
  Text,
} from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import {
  DateRangePicker,
  dateRangePickerHelper,
} from '~components/DateRangePicker'
import Menu from '~components/Menu'

import { useStorageResponsesContext } from '../StorageResponsesContext'

import { useUnlockedResponses } from './UnlockedResponsesProvider'

const SectionLabel = ({ children }: { children: string }) => (
  <Text textStyle="subhead-3" color="secondary.500" px="1rem" pt="1rem">
    {children}
  </Text>
)

export const FilterMenu = (): JSX.Element => {
  const { t } = useTranslation()
  const {
    dateRange: dateRangeLabel,
    columns,
    checkAll,
    uncheckAll,
  } = t(
    'features.adminForm.responses.responsesPage.storage.unlockedResponses.filterMenu',
    { returnObjects: true },
  )
  const {
    columnOptions,
    excludedSearchColumnIds,
    toggleSearchColumn,
    setAllSearchColumns,
  } = useUnlockedResponses()
  const { dateRange, setDateRange } = useStorageResponsesContext()

  const [draftDateRange, setDraftDateRange] = useState(dateRange)

  useEffect(() => setDraftDateRange(dateRange), [dateRange])

  const commitDateRange = useCallback(() => {
    if (
      draftDateRange[0] === dateRange[0] &&
      draftDateRange[1] === dateRange[1]
    ) {
      return
    }
    setDateRange(draftDateRange)
  }, [dateRange, draftDateRange, setDateRange])

  return (
    <Menu
      closeOnSelect={false}
      placement="bottom-start"
      onClose={commitDateRange}
    >
      {({ isOpen }) => (
        <>
          <MenuButton
            as={Button}
            variant="clear"
            colorScheme="secondary"
            isActive={isOpen}
            leftIcon={<BiFilterAlt fontSize="1.25rem" />}
            rightIcon={isOpen ? <BxsChevronUp /> : <BxsChevronDown />}
          >
            {t(
              'features.adminForm.responses.responsesPage.storage.unlockedResponses.toolbar.filter',
            )}
          </MenuButton>
          <MenuList maxH="28rem" overflowY="auto" minW="20rem">
            <SectionLabel>{dateRangeLabel}</SectionLabel>
            <Box px="1rem" py="0.75rem">
              <DateRangePicker
                value={dateRangePickerHelper.dateStringToDatePickerValue(
                  draftDateRange,
                )}
                onChange={(nextDateRange) =>
                  setDraftDateRange(
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
            <ButtonGroup px="1rem" py="0.75rem" spacing="0.5rem">
              <Button
                variant="clear"
                size="sm"
                onClick={() => setAllSearchColumns(true)}
              >
                {checkAll}
              </Button>
              <Button
                variant="clear"
                size="sm"
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
