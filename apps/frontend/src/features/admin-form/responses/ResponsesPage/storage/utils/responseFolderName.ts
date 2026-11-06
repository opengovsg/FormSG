// Characters Windows, macOS or Linux reject in a folder name
const INVALID_FOLDER_NAME_CHARACTERS = /[/\\:*?"<>|]/g

/** Strips characters that would nest or break a zip entry's name. */
export const removeInvalidFileNameCharacters = (name: string): string =>
  name.replace(INVALID_FOLDER_NAME_CHARACTERS, '')

/** A response folder's name: `RefNo <id>`. */
export const getResponseFolderName = ({ refNo }: { refNo: string }): string =>
  `RefNo ${refNo}`
