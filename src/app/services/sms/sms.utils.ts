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
  if (smsCount === smsConfig.smsVerificationLimit * smsThreshold.Half)
    return smsThreshold.Half
  else if (
    smsCount ===
    smsConfig.smsVerificationLimit * smsThreshold.ThreeQuarters
  )
    return smsThreshold.ThreeQuarters
  return false
}
