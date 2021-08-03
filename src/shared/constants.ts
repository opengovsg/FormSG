// Enum of actions that can be used to edit a form field
export enum EditFieldActions {
  Create = 'CREATE',
  Duplicate = 'DUPLICATE',
  Reorder = 'REORDER',
  Update = 'UPDATE',
  Delete = 'DELETE',
}

// Enum of date validation options
export enum DateSelectedValidation {
  NoPast = 'Disallow past dates',
  NoFuture = 'Disallow future dates',
  Custom = 'Custom date range',
}

// File types that can be uploaded for form image/logo
export const VALID_UPLOAD_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif']

export const KB = 1000
export const MB = 1000 * KB

// Define max file size as 2MB
export const MAX_UPLOAD_FILE_SIZE = 2 * MB // 2 Million/Mega Bytes, or 2 MB

export const LINKS = {
  supportFormLink: 'https://go.gov.sg/formsg-support',
}
