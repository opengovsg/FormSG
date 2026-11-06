import { expose } from 'comlink'

import { ZIP_STAGING_DIRECTORY, ZipStorageFullError } from '../utils/zipStaging'
import {
  MemoryZipSink,
  ZipEntry,
  ZipSink,
  ZipStreamWriter,
} from '../utils/ZipStreamWriter'

// Missing from TypeScript's DOM lib, which this worker is checked against
type SyncAccessHandle = {
  write(buffer: Uint8Array, options: { at: number }): number
  flush(): void
  close(): void
}
type SyncFileHandle = FileSystemFileHandle & {
  createSyncAccessHandle(): Promise<SyncAccessHandle>
}

const isQuotaExceeded = (error: unknown) =>
  error instanceof DOMException && error.name === 'QuotaExceededError'

/**
 * Writes the zip into the browser's private storage (OPFS), so it never sits
 * in memory. The synchronous handle only exists in workers, and works back to
 * Safari 15.2.
 */
class OpfsZipSink implements ZipSink {
  private offset = 0

  private constructor(
    private readonly directory: FileSystemDirectoryHandle,
    private readonly fileName: string,
    private readonly fileHandle: FileSystemFileHandle,
    private readonly handle: SyncAccessHandle,
  ) {}

  static async create(): Promise<OpfsZipSink> {
    const root = await navigator.storage.getDirectory()
    const directory = await root.getDirectoryHandle(ZIP_STAGING_DIRECTORY, {
      create: true,
    })
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.zip`
    const fileHandle = await directory.getFileHandle(fileName, {
      create: true,
    })
    const handle = await (fileHandle as SyncFileHandle).createSyncAccessHandle()
    return new OpfsZipSink(directory, fileName, fileHandle, handle)
  }

  write(chunk: Uint8Array) {
    let written: number
    try {
      written = this.handle.write(chunk, { at: this.offset })
    } catch (error) {
      if (isQuotaExceeded(error)) throw new ZipStorageFullError()
      throw error
    }
    if (written !== chunk.byteLength) throw new ZipStorageFullError()
    this.offset += written
  }

  async finish() {
    this.handle.flush()
    this.handle.close()
    // Backed by the file on disk, not read into memory
    return this.fileHandle.getFile()
  }

  async abort() {
    try {
      this.handle.close()
    } catch {
      // Already closed
    }
    await this.directory.removeEntry(this.fileName).catch(() => undefined)
  }
}

export type ZipSinkKind = 'opfs' | 'memory'

let writer: ZipStreamWriter | undefined

const getWriter = () => {
  if (!writer) throw new Error('Zip is not open')
  return writer
}

const zipWorkerApi = {
  /**
   * Starts a zip in private storage, or in memory when private storage can't
   * be opened (such as in a Firefox private window).
   */
  async open(): Promise<{ sink: ZipSinkKind; fallbackReason?: string }> {
    try {
      writer = new ZipStreamWriter(await OpfsZipSink.create())
      return { sink: 'opfs' }
    } catch (error) {
      writer = new ZipStreamWriter(new MemoryZipSink())
      return {
        sink: 'memory',
        fallbackReason:
          error instanceof Error
            ? `${error.name}: ${error.message}`
            : String(error),
      }
    }
  },

  add(entries: ZipEntry[]): Promise<void> {
    return getWriter().add(entries)
  },

  async finish(): Promise<{
    zip: Blob
    bytesWritten: number
    fileCount: number
  }> {
    const zipWriter = getWriter()
    const zip = await zipWriter.finish()
    writer = undefined
    return {
      zip,
      bytesWritten: zipWriter.bytesWritten,
      fileCount: zipWriter.fileCount,
    }
  },

  async abort(): Promise<void> {
    await writer?.abort()
    writer = undefined
  },
}

export type ZipWorkerApi = typeof zipWorkerApi

expose(zipWorkerApi)
