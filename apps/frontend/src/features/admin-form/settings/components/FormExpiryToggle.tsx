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

/**
 * Date pre-filled when the admin first switches the toggle on, purely so the
 * form is in a valid state before they pick a real deadline.
 */
const DEFAULT_EXPIRY_DAYS_FROM_NOW = 7

/**
 * Time of day used when the toggle is first switched on. 2359 because the PRD
 * evidence is near-unanimous that this is the deadline admins actually mean.
 */
const DEFAULT_EXPIRY_TIME = '23:59'

/**
 * Combines the admin's chosen calendar date and time of day into the single
 * instant stored as `closeAt`.
 *
 * NOTE: this resolves in the browser's timezone. Admins are in SGT so it is
 * correct in practice, but normalising to Asia/Singapore belongs on the server,
 * where the close instant is actually enforced.
 */
const toCloseAt = (date: Date, timeOfDay: string) => {
  const [hours, minutes] = timeOfDay.split(':').map(Number)
  return set(date, {
    hours,
    minutes,
    seconds: 0,
    milliseconds: 0,
  }).toISOString() as DateString
}

/** Whole days before today are unselectable; time-of-day is checked separately. */
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

  // Time is edited as free text, so it is held locally while the admin types
  // and only committed once it parses. The date, which can only be picked, is
  // read straight off the saved value.
  const [timeOfDay, setTimeOfDay] = useState(() => format(closeAtDate, 'HH:mm'))

  const save = useCallback(
    (nextDate: Date, nextTimeOfDay: string) => {
      const nextCloseAt = toCloseAt(nextDate, nextTimeOfDay)
      if (nextCloseAt === initialCloseAt) return
      return mutateFormCloseAt.mutate(nextCloseAt)
    },
    [initialCloseAt, mutateFormCloseAt],
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

      // The time is free text and may be mid-edit. Saving anyway would not
      // fail loudly — date-fns coerces a partial value, so "09:3" would quietly
      // persist 09:03 and an empty field would persist midnight. Refuse instead.
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

  const handleTimeBlur = useCallback(() => {
    if (!isValidTimeOfDay(timeOfDay)) {
      // Revert to the last saved time rather than stranding the admin on an
      // unparseable value they then have to fix.
      setTimeOfDay(format(closeAtDate, 'HH:mm'))
      return setError(
        t('features.adminForm.settings.general.expiry.invalidTime'),
      )
    }

    setError(undefined)
    return save(closeAtDate, timeOfDay)
  }, [closeAtDate, save, t, timeOfDay])

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
            // Both inputs derive their value from the last saved closeAt, so a
            // second edit made while a save is in flight would compute from a
            // stale base and could overwrite the newer value.
            isDisabled={mutateFormCloseAt.isLoading}
          />
        </Box>
        <Box maxW="8rem">
          <TimeInput
            value={timeOfDay}
            onChange={setTimeOfDay}
            onBlur={handleTimeBlur}
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

    // Case toggling the expiry date off.
    if (settings.closeAt) {
      return mutateFormCloseAt.mutate(null)
    }

    // Case toggling the expiry date on.
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
        label={t('features.adminForm.settings.general.expiry.label')}
        onChange={() => handleToggleExpiry()}
      />
      {settings?.closeAt && (
        <FormExpiryBlock initialCloseAt={settings.closeAt} />
      )}
    </Skeleton>
  ) : null
}
