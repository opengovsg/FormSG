import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, FormControl, Skeleton } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { addDays, endOfDay, isBefore, isValid } from 'date-fns'

import { featureFlags } from 'formsg-shared/constants'
import { DateString } from 'formsg-shared/types'

import { DatePicker } from '~components/DatePicker'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

/**
 * Date pre-filled when the admin first switches the toggle on, purely so the
 * form is in a valid state before they pick a real deadline.
 */
const DEFAULT_EXPIRY_DAYS_FROM_NOW = 7

/**
 * The picker is date-only for now, so a selected date means "closes at the end
 * of that day" — which is what admins ask for ("close at 2359 on the deadline").
 * Once the Time field lands this becomes an admin-chosen time of day.
 *
 * NOTE: this resolves end-of-day in the browser's timezone. Admins are in SGT so
 * it is correct in practice, but normalising to Asia/Singapore belongs on the
 * server, where the close instant is actually enforced.
 */
const toCloseAt = (date: Date) => endOfDay(date).toISOString() as DateString

const isPast = (date: Date): boolean => isBefore(endOfDay(date), new Date())

interface FormExpiryBlockProps {
  initialCloseAt: DateString
}

const FormExpiryBlock = ({
  initialCloseAt,
}: FormExpiryBlockProps): JSX.Element => {
  const { t } = useTranslation()
  const [error, setError] = useState<string>()
  const { mutateFormCloseAt } = useMutateFormSettings()

  const value = useMemo(() => new Date(initialCloseAt), [initialCloseAt])

  const handleChange = useCallback(
    (nextDate: Date | null) => {
      // Clearing the date is the toggle's job, not the picker's.
      if (!nextDate) return

      if (!isValid(nextDate) || isPast(nextDate)) {
        return setError(
          t('features.adminForm.settings.general.expiry.dateInThePast'),
        )
      }

      setError(undefined)
      const nextCloseAt = toCloseAt(nextDate)
      if (nextCloseAt === initialCloseAt) return

      return mutateFormCloseAt.mutate(nextCloseAt)
    },
    [initialCloseAt, mutateFormCloseAt, t],
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
      <Box maxW="16rem">
        <DatePicker
          value={value}
          onChange={handleChange}
          isDateUnavailable={isPast}
        />
      </Box>
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  )
}

export const FormExpiryToggle = (): JSX.Element => {
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
      toCloseAt(addDays(new Date(), DEFAULT_EXPIRY_DAYS_FROM_NOW)),
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
  ) : (
    <></>
  )
}
