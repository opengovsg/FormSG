import { SmsCountsDto } from '~shared/types/form'

export const formatSmsCounts = (smsCounts?: SmsCountsDto): string => {
  if (!smsCounts) {
    return 'Loading...'
  }
  return `${smsCounts.freeSmsCounts.toLocaleString()}/${smsCounts.quota.toLocaleString()} SMSes used`
}
