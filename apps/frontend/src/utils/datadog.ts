import type { RumGlobal } from '@datadog/browser-rum'

import { FormResponseMode } from 'formsg-shared/types/form/form'

/**
 * Retrieves the datadogRum instance from the window object.
 *
 * `datadogRum` imported from `'@datadog/browser-rum'` refers to a different datadog instance as the chunk is loaded separately from the js bundle.
 * Instead, we have to extract the global variable from the window object.
 * */
const _datadogRum = window.DD_RUM as RumGlobal | undefined

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}
const handler = {
  get: (target: RumGlobal, prop: keyof RumGlobal) => {
    if (Object.keys(target).length === 0) {
      return noop
    }
    return target[prop]
  },
}

export const datadogRum = new Proxy<RumGlobal>(
  _datadogRum || ({} as RumGlobal),
  handler,
)

/**
 * Sends a custom action to Datadog RUM once the SDK is ready.
 *
 * Unlike the `datadogRum` proxy above (which captures `window.DD_RUM` at
 * module load), this reads the global at call time and defers via `onReady`,
 * so actions are not dropped if the datadog chunk loads after the app bundle.
 */
export const sendDdAction = async (fnCall: () => void): Promise<void> => {
  const ddRum = window.DD_RUM
  if (!ddRum) {
    console.error('Datadog RUM does not exist, unable to send custom action')
    return
  }

  try {
    await ddRum.onReady(() => {
      fnCall()
    })
  } catch (e) {
    console.error('Failed to send DD action', { error: e, fnCall })
  }
}

/**
 * Tracks how long an admin spent on the form creation selection screen
 * (the details step of the create form modal) before proceeding.
 */
export const sendDdFormCreationSelectionAction = async (
  responseMode: FormResponseMode,
  durationMs: number,
): Promise<void> => {
  await sendDdAction(() => {
    window.DD_RUM?.addAction('dashboard.create.selection_screen_completed', {
      response_mode: responseMode,
      duration_ms: Math.round(durationMs),
    })
  })
}
