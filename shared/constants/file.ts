// Constants relating to files used across the application.

/** File types that can be uploaded for form image/logo */
export const VALID_UPLOAD_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif']

export const KB = 1024
export const MB = 1024 * KB

// Define max file size as 2MB
export const MAX_UPLOAD_FILE_SIZE = 2 * MB // 2 Million/Mega Bytes, or 2 MB

/** Decimal byte units sorted in ascending order */
export const DECIMAL_BYTE_UNITS = ['B', 'kB', 'MB', 'GB', 'TB']
