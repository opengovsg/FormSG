import JSZip from 'jszip'

import { DecryptedAttachmentFile } from '../types'

export const unzipMultiAttachment = async (
  zip: Uint8Array,
): Promise<DecryptedAttachmentFile[]> => {
  const archive = await JSZip.loadAsync(zip)
  return Promise.all(
    archive
      .filter((_path, entry) => !entry.dir)
      .map(async (entry) => ({
        filename: entry.name,
        content: (await entry.async('uint8array')) as Uint8Array<ArrayBuffer>,
      })),
  )
}
