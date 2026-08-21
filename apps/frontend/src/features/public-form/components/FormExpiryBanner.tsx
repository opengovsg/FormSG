import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatInTimeZone } from 'date-fns-tz'

import { Banner } from '~components/Banner'

import { usePublicFormContext } from '../PublicFormContext'

/**
 * FormSG deadlines are always Singapore time, and a respondent may well not be.
 * Formatting in SGT and labelling it is the only reading that cannot mislead —
 * the respondent's own timezone would show a different wall-clock time than the
 * one the agency published.
 */
const SGT = 'Asia/Singapore'

export const FormExpiryBanner = (): JSX.Element | null => {
  const { t } = useTranslation()
  const { form } = usePublicFormContext()

  const closesAt = useMemo(() => {
    if (!form?.closeAt) return null

    const closeAt = new Date(form.closeAt)
    // A lapsed deadline should never reach here — the server refuses to serve
    // the form at all once it passes — but a tab left open across the deadline
    // would otherwise keep advertising a time that has already gone.
    if (closeAt <= new Date()) return null

    return formatInTimeZone(closeAt, SGT, "d MMM yyyy, h:mmaaa '(SGT)'")
  }, [form?.closeAt])

  if (!closesAt) return null

  return (
    <Banner variant="info">
      {t('features.publicForm.expiry.banner', { closesAt })}
    </Banner>
  )
}
