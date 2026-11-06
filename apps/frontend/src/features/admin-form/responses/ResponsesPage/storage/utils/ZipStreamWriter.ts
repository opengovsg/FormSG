import { makeZip } from 'client-zip'

/** A file in the zip, or an empty folder when it has no content. */
export type ZipEntry = {
  name: string
  content?: Uint8Array | Blob
}

/** Where the zip's bytes go as they are made. */
export interface ZipSink {
  write(chunk: Uint8Array): Promise<void> | void
  /** The finished zip. */
  finish(): Promise<Blob>
  /** Discards everything written so far. */
  abort(): Promise<void>
}

export class ZipStreamWriter {
  private queue: ZipEntry[] = []
  // Wakes the zip stream when an entry is added or the writer closes
  private wake?: () => void
  private isClosed = false
  private error?: unknown
  private pulledCount = 0
  private addedCount = 0
  // Resolves add() calls once client-zip has taken their last entry
  private pullWaiters: { count: number; resolve: () => void }[] = []
  private readonly pump: Promise<void>
  private readonly reader: ReadableStreamDefaultReader<Uint8Array>

  bytesWritten = 0
  fileCount = 0

  constructor(private readonly sink: ZipSink) {
    this.reader = makeZip(this.entries(), {
      buffersAreUTF8: true,
    }).getReader()
    this.pump = this.runPump()
    // Callers see a failed write through add() or finish()
    this.pump.catch(() => undefined)
  }

  /**
   * Adds entries to the zip, in order. Resolves once client-zip has taken the
   * last of them, so at most one entry is waiting behind the one being written.
   */
  add(entries: ZipEntry[]): Promise<void> {
    if (this.error) return Promise.reject(this.error)
    if (this.isClosed) return Promise.reject(new Error('Zip is closed'))
    // Nothing to wait for, and no pull would ever resolve it
    if (!entries.length) return Promise.resolve()
    this.queue.push(...entries)
    this.addedCount += entries.length
    this.fileCount += entries.filter(({ content }) => content).length
    const count = this.addedCount
    const pulled = new Promise<void>((resolve) =>
      this.pullWaiters.push({ count, resolve }),
    )
    this.notify()
    // A write that fails rejects the add() waiting on it
    return Promise.race([pulled, this.pump.then(() => undefined)])
  }

  /** Writes the end of the zip and returns it. */
  async finish(): Promise<Blob> {
    this.isClosed = true
    this.notify()
    await this.pump
    return this.sink.finish()
  }

  /** Stops writing and discards the zip. */
  async abort(): Promise<void> {
    this.isClosed = true
    this.queue = []
    this.error ??= new Error('Zip aborted')
    this.notify()
    await this.reader.cancel(this.error).catch(() => undefined)
    await this.pump.catch(() => undefined)
    await this.sink.abort()
  }

  private notify() {
    this.wake?.()
    this.wake = undefined
  }

  private async *entries() {
    for (;;) {
      if (this.error) throw this.error
      const entry = this.queue.shift()
      if (entry) {
        this.pulledCount += 1
        this.resolvePulled()
        const { name, content } = entry
        yield content ? { name, input: content } : { name }
        continue
      }
      if (this.isClosed) return
      await new Promise<void>((resolve) => (this.wake = resolve))
    }
  }

  private resolvePulled() {
    this.pullWaiters = this.pullWaiters.filter(({ count, resolve }) => {
      if (count > this.pulledCount) return true
      resolve()
      return false
    })
  }

  private async runPump() {
    try {
      for (;;) {
        const { done, value } = await this.reader.read()
        if (done) return
        await this.sink.write(value)
        this.bytesWritten += value.byteLength
      }
    } catch (error) {
      this.error ??= error
      this.notify()
      await this.reader.cancel(error).catch(() => undefined)
      throw this.error
    }
  }
}

// Large enough to keep the number of Blob parts small, small enough that the
// browser can move finished parts out of the page's memory
const MEMORY_SINK_PART_BYTES = 32 * 1024 * 1024

/** Collects the zip into a Blob, when the browser's private storage can't be used. */
export class MemoryZipSink implements ZipSink {
  private parts: Blob[] = []
  private chunks: Uint8Array[] = []
  private chunkBytes = 0

  write(chunk: Uint8Array) {
    this.chunks.push(chunk)
    this.chunkBytes += chunk.byteLength
    if (this.chunkBytes >= MEMORY_SINK_PART_BYTES) this.flushChunks()
  }

  async finish() {
    this.flushChunks()
    const zip = new Blob(this.parts, { type: 'application/zip' })
    this.parts = []
    return zip
  }

  async abort() {
    this.parts = []
    this.chunks = []
    this.chunkBytes = 0
  }

  private flushChunks() {
    if (!this.chunks.length) return
    this.parts.push(new Blob(this.chunks as BlobPart[]))
    this.chunks = []
    this.chunkBytes = 0
  }
}
