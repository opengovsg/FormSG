// The folder in the browser's private storage (OPFS) that holds zips being built
export const ZIP_STAGING_DIRECTORY = 'response-download-zips'

const ZIP_STORAGE_FULL_ERROR_NAME = 'ZipStorageFullError'

/** The browser's private storage filled up partway through a zip. */
export class ZipStorageFullError extends Error {
  constructor() {
    super('Not enough storage space to build the download zip')
    this.name = ZIP_STORAGE_FULL_ERROR_NAME
  }
}

/** Matches by name, as the error crosses from the zip worker through comlink. */
export const isZipStorageFullError = (error: unknown): boolean =>
  error instanceof Error && error.name === ZIP_STORAGE_FULL_ERROR_NAME

/**
 * Deletes zips left in the browser's private storage by earlier downloads. A
 * finished zip is kept until now because its download reads from it. A zip
 * still being built in another tab is locked, so it is skipped.
 */
export const clearStagedZips = async (): Promise<void> => {
  try {
    const root = await navigator.storage.getDirectory()
    // Throws when no download has staged a zip yet
    const directory = await root.getDirectoryHandle(ZIP_STAGING_DIRECTORY)
    // keys() is missing from TypeScript's DOM lib
    const names = (
      directory as FileSystemDirectoryHandle & {
        keys(): AsyncIterable<string>
      }
    ).keys()
    for await (const name of names) {
      await directory.removeEntry(name).catch(() => undefined)
    }
  } catch {
    // Nothing staged, or private storage is unavailable
  }
}
