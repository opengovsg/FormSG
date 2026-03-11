import { smsConfig } from '../../config/features/sms.config'

export enum smsThreshold {
  Half = 0.5,
  ThreeQuarters = 0.75,
}

/**
 *
 * @param initialCount smsCount before a db update
 * @returns
 */
export const hasHitSmsThreshold = ({
  smsCount,
}: {
  smsCount: number
}): smsThreshold | false => {
  if (
    smsCount === Math.floor(smsConfig.smsVerificationLimit * smsThreshold.Half)
  )
    return smsThreshold.Half
  if (
    smsCount ===
    Math.floor(smsConfig.smsVerificationLimit * smsThreshold.ThreeQuarters)
  )
    return smsThreshold.ThreeQuarters
  return false
}
