import { TFunction } from 'i18next'

type EscapeHatchBetaFlags = {
  children?: boolean
  createStorageModeForV1Webhook?: boolean
}

export type EscapeHatchCopy = {
  prefix: string
  linkText: string
  suffix: string
}

// TODO [MRF-CUTOVER]: Remove after cutover.
const KEY = 'features.workspace.modals.forms.create.escapeHatch'

export const composeEscapeHatchCopy = (
  t: TFunction,
  betaFlags?: EscapeHatchBetaFlags,
): EscapeHatchCopy => {
  const reasons: string[] = [t(`${KEY}.reasons.payments`)]
  if (betaFlags?.children) reasons.push(t(`${KEY}.reasons.children`))
  if (betaFlags?.createStorageModeForV1Webhook)
    reasons.push(t(`${KEY}.reasons.webhooksV1`))

  const reasonsString =
    reasons.length === 1
      ? reasons[0]
      : reasons.length === 2
        ? `${reasons[0]} or ${reasons[1]}`
        : `${reasons.slice(0, -1).join(', ')}, or ${reasons[reasons.length - 1]}`

  return {
    prefix: t(`${KEY}.prefix`, { reasons: reasonsString }),
    linkText: t(`${KEY}.linkText`),
    suffix: t(`${KEY}.suffix`),
  }
}
