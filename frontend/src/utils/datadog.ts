import type { RumGlobal } from '@datadog/browser-rum'

/**
 * Retrieves the datadogRum instance from the window object.
 *
 * `datadogRum` imported from `'@datadog/browser-rum'` refers to a different datadog instance as the chunk is loaded separately from the js bundle.
 * Instead, we have to extract the global variable from the window object.
 * */

// @ts-expect-error extracting DD_RUM that's initialised from window
export const datadogRum = window.DD_RUM as RumGlobal
