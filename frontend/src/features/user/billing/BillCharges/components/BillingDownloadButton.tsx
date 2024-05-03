import { useMemo } from 'react'
import { CSVLink } from 'react-csv'
import { BiDownload } from 'react-icons/bi'
import { Button } from '@opengovsg/design-system-react'

import { FormBillingStatistic } from '~shared/types'

import { DateRange, dateRangeToString } from '../../DateRange'

type BillingDownloadButtonProps = {
  esrvcId: string
  dateRange: DateRange
  loginStats: FormBillingStatistic[]
  isDisabled: boolean
}

export const BillingDownloadButton = ({
  esrvcId,
  dateRange,
  loginStats,
  isDisabled,
}: BillingDownloadButtonProps) => {
  const data = useMemo(() => {
    if (!loginStats) return ''
    return loginStats?.map((entry) => ({
      formTitle: entry.formName,
      owner: entry.adminEmail,
      auth: entry.authType,
      numLogins: entry.total,
    }))
  }, [loginStats])

  const dateRangeString = dateRangeToString(dateRange)

  return (
    <Button
      isDisabled={isDisabled}
      as={isDisabled ? undefined : CSVLink}
      filename={`${esrvcId}-charges-${dateRangeString}.csv`}
      data={data}
      target="_blank"
      leftIcon={<BiDownload fontSize="1.5rem" />}
    >
      Export
    </Button>
  )
}
