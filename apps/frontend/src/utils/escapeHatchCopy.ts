type EscapeHatchBetaFlags = {
  children?: boolean
  createStorageModeForV1Webhook?: boolean
}

export type EscapeHatchCopy = {
  prefix: string
  linkText: string
  suffix: string
}

const LINK_TEXT = 'old version of FormSG'
const SUFFIX = '.'

export const composeEscapeHatchCopy = (
  betaFlags?: EscapeHatchBetaFlags,
): EscapeHatchCopy => {
  const reasons: string[] = ['payments']
  if (betaFlags?.children) reasons.push('MyInfo children fields')
  if (betaFlags?.createStorageModeForV1Webhook) reasons.push('webhooks v1')

  const reasonsString =
    reasons.length === 1
      ? reasons[0]
      : reasons.length === 2
        ? `${reasons[0]} or ${reasons[1]}`
        : `${reasons.slice(0, -1).join(', ')}, or ${reasons[reasons.length - 1]}`

  return {
    prefix: `Need ${reasonsString}? Use the `,
    linkText: LINK_TEXT,
    suffix: SUFFIX,
  }
}
