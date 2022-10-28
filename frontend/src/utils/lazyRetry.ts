import { ComponentType } from 'react'

/**
 * Retry React.lazy calls on error, or refresh the page if it was a chunk load
 * error to hopefully retrieve the correct version of the chunk to due
 * no-cache header.
 *
 * Retrieved from https://www.codemzy.com/blog/fix-chunkloaderror-react.
 *
 * @note this only works for route based code splitting https://reactjs.org/docs/code-splitting.html#route-based-code-splitting
 * Will cause infinite loop if used for normal code splitting since multiple lazy calls may be triggered in a single component.
 */
export const lazyRetry = <T extends ComponentType>(
  componentImport: () => Promise<{ default: T }>,
) => {
  const sessionStorageKey = `retry-lazy-${process.env.REACT_APP_VERSION}-refreshed`

  return new Promise<{ default: T }>((resolve, reject) => {
    // check if the window has already been refreshed
    const hasRefreshed = JSON.parse(
      window.sessionStorage.getItem(sessionStorageKey) || 'false',
    )
    // try to import the component
    componentImport()
      .then((component) => {
        window.sessionStorage.setItem(sessionStorageKey, 'false') // success so reset the refresh
        resolve(component)
      })
      .catch((error) => {
        if (!hasRefreshed) {
          // not been refreshed yet
          window.sessionStorage.setItem(sessionStorageKey, 'true') // we are now going to refresh
          return window.location.reload() // refresh the page
        }
        reject(error) // Default error behaviour as already tried refresh
      })
  })
}
