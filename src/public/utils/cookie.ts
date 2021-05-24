/**
 * Options to add to cookies during cookie manipulation.
 */
export type CookieBuilderOptions = {
  path?: string
  domain?: string
  secure?: boolean
  samesite?: string
  expires?: string | Date
}

/**
 * Private helper method to build cookie string according to name, value and options.
 * Modified from AngularJS's implementation
 * https://github.com/angular/angular.js/blob/master/src/ngCookies/cookieWriter.js
 */
const buildCookieString = (
  name: string,
  value: string | undefined,
  options: CookieBuilderOptions = {},
) => {
  let expires: string | Date | undefined
  expires = options.expires
  if (!value) {
    expires = new Date(0)
    value = ''
  }
  if (typeof expires === 'string') {
    expires = new Date(expires)
    // Set to epoch 0 if option.expires is invalid date.
    if (isNaN(expires.getTime())) {
      expires = new Date(0)
    }
  }

  const path = options.path ?? ''

  let cookieStr = encodeURIComponent(name) + '=' + encodeURIComponent(value)
  cookieStr += path ? ';path=' + path : ''
  cookieStr += options.domain ? ';domain=' + options.domain : ''
  cookieStr += expires ? ';expires=' + expires.toUTCString() : ''
  cookieStr += options.secure ? ';secure' : ''
  cookieStr += options.samesite ? ';samesite=' + options.samesite : ''

  return cookieStr
}

/**
 * Helper method to retrieve a cookie value by name.
 * Retrieved from https://stackoverflow.com/a/25346429.
 * @param name name of cookie to retrieve
 * @returns cookie referenced by name, if available. Null otherwise.
 */
export const getCookie = (name: string): string | null => {
  const escape = (s: string) => s.replace(/([.*+?^${}()|[\]/\\])/g, '\\$1')

  const match = document.cookie.match(
    RegExp('(?:^|;\\s*)' + escape(name) + '=([^;]*)'),
  )
  return match ? match[1] : null
}

/**
 * Deletes cookie with given name.
 * @param name name of cookie to delete
 * @param options options of cookie
 */
export const deleteCookie = (
  name: string,
  options: CookieBuilderOptions = {},
): void => {
  document.cookie = buildCookieString(name, undefined, options)
}
