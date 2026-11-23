import { TFunction } from 'i18next'

import { FailedDownload } from '../types'

const TOMBSTONE_PREFIX = '(FAILED TO DOWNLOAD)'

export const getTombstoneName = (name: string): string => {
  const extensionStart = name.lastIndexOf('.')
  const baseName = extensionStart > 0 ? name.slice(0, extensionStart) : name
  return `${TOMBSTONE_PREFIX} ${baseName}.txt`
}

export const FAILED_RESPONSE_NAME = 'Response'

const REASON_TEXT: Record<FailedDownload['reason'], string> = {
  download: 'This file could not be downloaded, even after retrying.',
  decrypt: 'This file was downloaded but could not be decrypted.',
  pdf: 'The PDF of this response could not be created.',
  response: 'This response could not be downloaded.',
}

export const getTombstoneContent = ({
  refNo,
  name,
  reason,
}: FailedDownload): Uint8Array<ArrayBuffer> =>
  new TextEncoder().encode(
    [
      REASON_TEXT[reason],
      '',
      `Response: ${refNo}`,
      ...(reason === 'response' ? [] : [`File: ${name}`]),
      '',
      'Open this response in FormSG to get it again.',
      '',
    ].join('\n'),
  )

const MAX_LISTED_FAILURES = 5

const PREFIX =
  'features.adminForm.responses.responsesPage.storage.unlockedResponses.progressModal.completeScreen'

export const getFailedDownloadsSummary = (
  t: TFunction,
  failedDownloads: FailedDownload[],
): { message: string; items: string[] } => {
  const otherCount = failedDownloads.length - MAX_LISTED_FAILURES
  return {
    message: t(`${PREFIX}.failedFilesTitle`, { count: failedDownloads.length }),
    items: [
      ...failedDownloads
        .slice(0, MAX_LISTED_FAILURES)
        .map(({ refNo, name }) =>
          t(`${PREFIX}.failedFileItem`, { refNo, name }),
        ),
      ...(otherCount > 0
        ? [t(`${PREFIX}.otherFailedFiles`, { count: otherCount })]
        : []),
    ],
  }
}
