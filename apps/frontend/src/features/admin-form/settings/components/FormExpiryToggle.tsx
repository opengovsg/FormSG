import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, FormControl, Skeleton, Stack } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { addDays, endOfDay, format, isBefore, isValid, set } from 'date-fns'

import { featureFlags } from 'formsg-shared/constants'
import { DateString } from 'formsg-shared/types'

import { DatePicker } from '~components/DatePicker'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

import { isValidTimeOfDay, TimeInput } from './TimeInput'

// Tomorrow: the nearest date unambiguously in the future, so the pre-fill
// reads as a placeholder rather than as a deadline the product picked.
const DEFAULT_EXPIRY_DAYS_FROM_NOW = 1

const DEFAULT_EXPIRY_TIME = '23:59'

// NOTE: resolves in the browser's timezone, not Asia/Singapore.
const toCloseAt = (date: Date, timeOfDay: string) => {
  const [hours, minutes] = timeOfDay.split(':').map(Number)
  return set(date, {
    hours,
    minutes,
    seconds: 0,
    milliseconds: 0,
  }).toISOString() as DateString
}

const isPastDay = (date: Date): boolean => isBefore(endOfDay(date), new Date())

interface FormExpiryBlockProps {
  initialCloseAt: DateString
}

const FormExpiryBlock = ({
  initialCloseAt,
}: FormExpiryBlockProps): JSX.Element => {
  const { t } = useTranslation()
  const [error, setError] = useState<string>()
  const { mutateFormCloseAt } = useMutateFormSettings()

  const closeAtDate = useMemo(() => new Date(initialCloseAt), [initialCloseAt])

  const [timeOfDay, setTimeOfDay] = useState(() => format(closeAtDate, 'HH:mm'))

  const save = useCallback(
    (nextDate: Date, nextTimeOfDay: string) => {
      const nextCloseAt = toCloseAt(nextDate, nextTimeOfDay)

      // isPastDay only rejects whole days, so today can still be in the past.
      if (isBefore(new Date(nextCloseAt), new Date())) {
        return setError(
          t('features.adminForm.settings.general.expiry.dateInThePast'),
        )
      }

      setError(undefined)
      if (nextCloseAt === initialCloseAt) return
      return mutateFormCloseAt.mutate(nextCloseAt)
    },
    [initialCloseAt, mutateFormCloseAt, t],
  )

  const handleDateChange = useCallback(
    (nextDate: Date | null) => {
      // Clearing the date is the toggle's job, not the picker's.
      if (!nextDate) return

      if (!isValid(nextDate) || isPastDay(nextDate)) {
        return setError(
          t('features.adminForm.settings.general.expiry.dateInThePast'),
        )
      }

      // date-fns coerces a partial time rather than rejecting it, so "09:3"
      // would silently persist 09:03.
      if (!isValidTimeOfDay(timeOfDay)) {
        return setError(
          t('features.adminForm.settings.general.expiry.invalidTime'),
        )
      }

      setError(undefined)
      return save(nextDate, timeOfDay)
    },
    [save, t, timeOfDay],
  )

  // Fired once the admin is done, with the time already normalised, so a bad
  // value stays on screen next to the error rather than being reverted.
  const handleTimeCommit = useCallback(
    (nextTimeOfDay: string | null) => {
      if (!nextTimeOfDay) {
        return setError(
          t('features.adminForm.settings.general.expiry.invalidTime'),
        )
      }

      setError(undefined)
      setTimeOfDay(nextTimeOfDay)
      return save(closeAtDate, nextTimeOfDay)
    },
    [closeAtDate, save, t],
  )

  return (
    <FormControl mt="2rem" isInvalid={!!error}>
      <FormLabel
        isRequired
        description={t(
          'features.adminForm.settings.general.expiry.input.description',
        )}
      >
        {t('features.adminForm.settings.general.expiry.input.label')}
      </FormLabel>
      <Stack direction={{ base: 'column', md: 'row' }} spacing="1rem">
        <Box maxW="16rem" flex={1}>
          <DatePicker
            value={closeAtDate}
            onChange={handleDateChange}
            isDateUnavailable={isPastDay}
            // Both inputs derive from the last saved closeAt, so an edit made
            // mid-save would compute from a stale base.
            isDisabled={mutateFormCloseAt.isLoading}
          />
        </Box>
        <Box maxW="8rem">
          <TimeInput
            value={timeOfDay}
            onChange={setTimeOfDay}
            onCommit={handleTimeCommit}
            isDisabled={mutateFormCloseAt.isLoading}
            aria-label={t(
              'features.adminForm.settings.general.expiry.input.timeLabel',
            )}
          />
        </Box>
      </Stack>
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  )
}

export const FormExpiryToggle = (): JSX.Element | null => {
  const { t } = useTranslation()
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  // TODO(FRM-2376): Remove this check once scheduled closure is stable.
  const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'
  const isEnabled = useFeatureIsOn(featureFlags.scheduledFormClosure) || isTest

  const { mutateFormCloseAt } = useMutateFormSettings()

  const isScheduled = useMemo(() => !!settings?.closeAt, [settings])

  const handleToggleExpiry = useCallback(() => {
    if (!settings || isLoadingSettings || mutateFormCloseAt.isLoading) return

    if (settings.closeAt) {
      return mutateFormCloseAt.mutate(null)
    }

    return mutateFormCloseAt.mutate(
      toCloseAt(
        addDays(new Date(), DEFAULT_EXPIRY_DAYS_FROM_NOW),
        DEFAULT_EXPIRY_TIME,
      ),
    )
  }, [isLoadingSettings, mutateFormCloseAt, settings])

  return isEnabled ? (
    <Skeleton isLoaded={!isLoadingSettings && !!settings} mt="2rem">
      <Toggle
        isLoading={mutateFormCloseAt.isLoading}
        isChecked={isScheduled}
        betaBadge
        label={t('features.adminForm.settings.general.expiry.label')}
        onChange={() => handleToggleExpiry()}
      />
      {settings?.closeAt && (
        <FormExpiryBlock initialCloseAt={settings.closeAt} />
      )}
    </Skeleton>
  ) : null
}
