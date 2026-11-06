const UNSAFE_ZIP_NAME_CHARACTERS = /[/\\:*?"<>|]/g

export const toSafeZipEntryName = (name: string): string =>
  name.replace(UNSAFE_ZIP_NAME_CHARACTERS, '')

export const getResponseFolderName = ({ refNo }: { refNo: string }): string =>
  `RefNo ${refNo}`
