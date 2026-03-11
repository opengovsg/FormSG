import { CanceledResult, DownloadResult } from '../types'

export const isCanceledResult = (
  result?: DownloadResult | CanceledResult,
): result is CanceledResult => {
  return !!(result as Partial<CanceledResult>)?.isCanceled
}
