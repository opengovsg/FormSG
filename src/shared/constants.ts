// Enum of actions that can be used to edit a form field
export enum EditFieldActions {
  Create = 'CREATE',
  Duplicate = 'DUPLICATE',
  Reorder = 'REORDER',
  Update = 'UPDATE',
  Delete = 'DELETE',
}

export enum FilePlatforms {
  Browser = 'browser',
  Server = 'server',
}

// File types that can be uploaded for form image/logo
export const VALID_UPLOAD_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif']

// Define max file size as 2MB
export const MAX_UPLOAD_FILE_SIZE = 2 * 1000 * 1000 // 2 Million/Mega Bytes, or 2 MB

export const LINKS = {
  supportFormLink: 'https://go.gov.sg/formsg-support',
}
