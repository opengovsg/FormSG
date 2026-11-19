export const ZIP_STAGING_DIRECTORY = 'response-download-zips'

const ZIP_STORAGE_FULL_ERROR_NAME = 'ZipStorageFullError'

export class ZipStorageFullError extends Error {
  constructor() {
    super('Not enough storage space to build the download zip')
    this.name = ZIP_STORAGE_FULL_ERROR_NAME
  }
}

/** Matches by name, as the error crosses from the zip worker through comlink. */
export const isZipStorageFullError = (error: unknown): boolean =>
  error instanceof Error && error.name === ZIP_STORAGE_FULL_ERROR_NAME

// A saved File reads from private storage lazily, so deleting it soon can break the download
const FINISHED_ZIP_KEEP_MS = 10 * 60 * 1000

export const clearStagedZips = async (): Promise<void> => {
  try {
    const root = await navigator.storage.getDirectory()
    const directory = await root.getDirectoryHandle(ZIP_STAGING_DIRECTORY)
    const names = (
      directory as FileSystemDirectoryHandle & {
        keys(): AsyncIterable<string>
      }
    ).keys()
    for await (const name of names) {
      try {
        const fileHandle = await directory.getFileHandle(name)
        const { lastModified } = await fileHandle.getFile()
        if (Date.now() - lastModified < FINISHED_ZIP_KEEP_MS) continue
        await directory.removeEntry(name)
      } catch {
        // Locked by the tab building it
      }
    }
  } catch {
    // Nothing staged, or private storage is unavailable
  }
}
