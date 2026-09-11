import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatInTimeZone } from 'date-fns-tz'

import { Banner } from '~components/Banner'

import { usePublicFormContext } from '../PublicFormContext'

// Deadlines are always Singapore time, and the respondent may not be.
const SGT = 'Asia/Singapore'

export const FormExpiryBanner = (): JSX.Element | null => {
  const { t } = useTranslation()
  const { form } = usePublicFormContext()

  const closesAt = useMemo(() => {
    if (!form?.closeAt) return null

    const closeAt = new Date(form.closeAt)
    // Only reachable in a tab left open across the deadline.
    if (closeAt <= new Date()) return null

    return formatInTimeZone(closeAt, SGT, "d MMM yyyy, h:mm a '(SGT)'")
  }, [form?.closeAt])

  if (!closesAt) return null

  return (
    <Banner variant="info">
      {t('features.publicForm.expiry.banner', { closesAt })}
    </Banner>
  )
}
