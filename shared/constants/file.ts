// Constants relating to files used across the application.

/** File types that can be uploaded for form image/logo */
export const VALID_UPLOAD_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif']

/** File types that can be uploaded for form MFB */
export const VALID_UPLOAD_FILE_TYPES_PDF = '.pdf'

export const KB = 1000
export const MB = 1000 * KB

// Define max file size as 2MB
export const MAX_UPLOAD_FILE_SIZE = 2 * MB // 2 Million/Mega Bytes, or 2 MB

// Define max file size as 5MB for MFB PDF uploads
export const PDF_UPLOAD_FILE_SIZE_LIMIT = 5 * MB // 5 Million/Mega Bytes, or 5 MB

/** Decimal byte units sorted in ascending order */
export const DECIMAL_BYTE_UNITS = ['B', 'kB', 'MB', 'GB', 'TB']

/** Character limit for Prompts for MFB */
export const PROMPT_CHAR_LIMIT = 300
