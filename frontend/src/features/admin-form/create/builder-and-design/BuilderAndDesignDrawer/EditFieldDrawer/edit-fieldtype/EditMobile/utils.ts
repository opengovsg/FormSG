import { SmsCountsDto } from 'formsg-shared/types/form'

export const formatSmsCounts = (smsCounts?: SmsCountsDto): string => {
  if (!smsCounts) {
    return 'Loading...'
  }
  return `${smsCounts.smsCounts.toLocaleString()}/${smsCounts.quota.toLocaleString()}`
}
