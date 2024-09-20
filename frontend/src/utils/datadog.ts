import type { RumGlobal } from '@datadog/browser-rum'

/**
 * Retrieves the datadogRum instance from the window object.
 *
 * `datadogRum` imported from `'@datadog/browser-rum'` refers to a different datadog instance as the chunk is loaded separately from the js bundle.
 * Instead, we have to extract the global variable from the window object.
 * */
const _datadogRum = window.DD_RUM as RumGlobal | undefined

const noop = () => {}
const handler = {
  get: (target: RumGlobal, prop: keyof RumGlobal) => {
    if (Object.keys(target).length === 0) {
      return noop
    }
    return target[prop]
  },
}

export const datadogRum = new Proxy(_datadogRum || {}, handler)
