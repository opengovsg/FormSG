import simplur from 'simplur'

import { FailedDownload } from '../types'

const TOMBSTONE_PREFIX = '(FAILED TO DOWNLOAD)'

/**
 * The placeholder's name for something left out of the zip. The name's own
 * extension is dropped, so the placeholder ends in `.txt` only.
 */
export const getTombstoneName = (name: string): string => {
  const extensionStart = name.lastIndexOf('.')
  const baseName = extensionStart > 0 ? name.slice(0, extensionStart) : name
  return `${TOMBSTONE_PREFIX} ${baseName}.txt`
}

/** The name a whole failed response's placeholder goes by. */
export const FAILED_RESPONSE_NAME = 'Response'

const REASON_TEXT: Record<FailedDownload['reason'], string> = {
  download: 'This file could not be downloaded, even after retrying.',
  decrypt: 'This file was downloaded but could not be decrypted.',
  pdf: 'The PDF of this response could not be created.',
  response: 'This response could not be downloaded.',
}

/** What the placeholder says, so it makes sense on its own. */
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

// How many failures the completion screen names before summing up the rest
const MAX_LISTED_FAILURES = 5

/**
 * What the completion screen says the zip left out: a count, then the first
 * few by ref no and the rest summed up.
 */
export const getFailedDownloadsSummary = (
  failedDownloads: FailedDownload[],
): { message: string; items: string[] } => {
  const otherCount = failedDownloads.length - MAX_LISTED_FAILURES
  return {
    message: simplur`${failedDownloads.length} file[|s] could not be downloaded:`,
    items: [
      ...failedDownloads
        .slice(0, MAX_LISTED_FAILURES)
        .map(({ refNo, name }) => `RefNo ${refNo} · ${name}`),
      ...(otherCount > 0 ? [simplur`and ${otherCount} other file[|s]`] : []),
    ],
  }
}
