import JSZip from 'jszip'
import { describe, expect, it, vi } from 'vitest'

import { ZipStorageFullError } from './zipStaging'
import { MemoryZipSink, ZipSink, ZipStreamWriter } from './ZipStreamWriter'

const bytes = (text: string) => new TextEncoder().encode(text)

/** Keeps the zip's bytes, as jsdom's Blob can't be read back. */
const makeCollectingSink = () => {
  const chunks: Uint8Array[] = []
  const sink: ZipSink = {
    write: (chunk) => {
      chunks.push(chunk.slice())
    },
    finish: async () => new Blob(),
    abort: async () => undefined,
  }
  const readZip = () => {
    const zipBytes = new Uint8Array(
      chunks.reduce((total, chunk) => total + chunk.byteLength, 0),
    )
    let offset = 0
    for (const chunk of chunks) {
      zipBytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    return JSZip.loadAsync(zipBytes)
  }
  return { sink, readZip }
}

describe('ZipStreamWriter', () => {
  it('writes folders and files in order into a readable zip', async () => {
    const { sink, readZip } = makeCollectingSink()
    const writer = new ZipStreamWriter(sink)

    await writer.add([
      { name: 'RefNo a1/' },
      { name: 'RefNo a1/Question 2 - passport.pdf', content: bytes('pass') },
      { name: 'RefNo a1/RefNo a1.pdf', content: bytes('pdf') },
    ])
    await writer.add([{ name: 'RefNo b2/' }])
    await writer.add([{ name: 'Form-123.csv', content: bytes('a,b') }])
    await writer.finish()

    const zip = await readZip()
    expect(Object.keys(zip.files)).toEqual([
      'RefNo a1/',
      'RefNo a1/Question 2 - passport.pdf',
      'RefNo a1/RefNo a1.pdf',
      'RefNo b2/',
      'Form-123.csv',
    ])
    expect(
      await zip.file('RefNo a1/Question 2 - passport.pdf')?.async('string'),
    ).toBe('pass')
    expect(await zip.file('Form-123.csv')?.async('string')).toBe('a,b')
    expect(writer.fileCount).toBe(3)
    expect(writer.bytesWritten).toBeGreaterThan(0)
  })

  it('resolves an empty add() without stalling later ones', async () => {
    const { sink, readZip } = makeCollectingSink()
    const writer = new ZipStreamWriter(sink)

    await writer.add([{ name: 'a.txt', content: bytes('a') }])
    await writer.add([])
    await writer.add([{ name: 'b.txt', content: bytes('b') }])
    await writer.finish()

    expect(Object.keys((await readZip()).files)).toEqual(['a.txt', 'b.txt'])
  })

  it('keeps non-ASCII file names', async () => {
    const { sink, readZip } = makeCollectingSink()
    const writer = new ZipStreamWriter(sink)

    await writer.add([{ name: 'Question 1 - 照片.jpg', content: bytes('x') }])
    await writer.finish()
    const zip = await readZip()

    expect(Object.keys(zip.files)).toEqual(['Question 1 - 照片.jpg'])
  })

  it('rejects finish() and later add() calls when the sink fails to write', async () => {
    const sink: ZipSink = {
      write: () => {
        throw new ZipStorageFullError()
      },
      finish: vi.fn(),
      abort: vi.fn(async () => undefined),
    }
    const writer = new ZipStreamWriter(sink)

    // Resolves once taken, before its bytes are written
    await writer
      .add([{ name: 'a.txt', content: bytes('a') }])
      .catch(() => undefined)

    await expect(writer.finish()).rejects.toThrow(ZipStorageFullError)
    await expect(
      writer.add([{ name: 'b.txt', content: bytes('b') }]),
    ).rejects.toThrow(ZipStorageFullError)
    expect(sink.finish).not.toHaveBeenCalled()
  })

  it('discards what was written when aborted', async () => {
    const sink = new MemoryZipSink()
    const abortSpy = vi.spyOn(sink, 'abort')
    const writer = new ZipStreamWriter(sink)

    await writer.add([{ name: 'a.txt', content: bytes('a') }])
    await writer.abort()

    expect(abortSpy).toHaveBeenCalled()
    await expect(
      writer.add([{ name: 'b.txt', content: bytes('b') }]),
    ).rejects.toThrow()
  })
})
