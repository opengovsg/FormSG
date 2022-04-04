import { SmsCountsDto } from '~shared/types/form'

export const formatSmsCounts = (smsCounts: SmsCountsDto): string => {
  return `${smsCounts.freeSmsCounts.toLocaleString()}/${smsCounts.quota.toLocaleString()} SMSes used`
}
