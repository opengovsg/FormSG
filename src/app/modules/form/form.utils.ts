// Converts 'test@hotmail.com, test@gmail.com' to ['test@hotmail.com', 'test@gmail.com']
export const transformEmailString = (v: string): string[] => {
  return v
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((email) => email.includes('@')) // remove ""
}

// Function that coerces the string of comma-separated emails sent by the client
// into an array of emails
export const transformEmails = (v: string | string[]): string[] => {
  // Cases
  // ['test@hotmail.com'] => ['test@hotmail.com'] ~ unchanged
  // ['test@hotmail.com', 'test@gmail.com'] => ['test@hotmail.com', 'test@gmail.com'] ~ unchanged
  // ['test@hotmail.com, test@gmail.com'] => ['test@hotmail.com', 'test@gmail.com']
  // ['test@hotmail.com, test@gmail.com', 'test@yahoo.com'] => ['test@hotmail.com', 'test@gmail.com', 'test@yahoo.com']
  // 'test@hotmail.com, test@gmail.com' => ['test@hotmail.com', 'test@gmail.com']
  if (Array.isArray(v)) {
    return transformEmailString(v.join(','))
  } else {
    return transformEmailString(v)
  }
}
