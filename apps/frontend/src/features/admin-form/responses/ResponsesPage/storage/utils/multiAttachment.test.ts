import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'

import { unzipMultiAttachment } from './multiAttachment'

describe('unzipMultiAttachment', () => {
  it('returns the files in the zip in order, without folders', async () => {
    const zip = new JSZip()
    zip.file('b.jpg', 'jpg')
    zip.file('a.pdf', 'pdf')
    zip.folder('ignored')

    const files = await unzipMultiAttachment(
      await zip.generateAsync({ type: 'uint8array' }),
    )

    expect(files.map(({ filename }) => filename)).toEqual(['b.jpg', 'a.pdf'])
    expect(new TextDecoder().decode(files[1].content)).toBe('pdf')
  })
})
