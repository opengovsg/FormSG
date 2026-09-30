import 'inter-ui/inter.css'
import './i18n/i18n'
import './polyfills'

import * as React from 'react'
import { createRoot } from 'react-dom/client'

import { registerChunkPreloadErrorListener } from './app/chunkPreloadError'
import { isWorkflowPrototype } from './features/admin-form/responses/prototype/config'
import * as dayjs from './utils/dayjs'
import { env } from './env'

if (import.meta.env.MODE === 'test') {
  import('./mocks/msw/browser').then(({ worker }) => worker.start())
}

registerChunkPreloadErrorListener()

// Init Google Analytics
declare global {
  // eslint-disable-next-line no-var
  var dataLayer: unknown[]
}

window.dataLayer = window.dataLayer || []
function gtag(...args: unknown[]) {
  // eslint-disable-next-line prefer-rest-params
  dataLayer.push(arguments)
}
gtag('js', new Date())
gtag('config', env.gaTrackingId || '')
window.gtag = gtag

// Init dayjs
dayjs.init()

/**
 * TODO(FRM-1855): Disable strict mode for validation to work properly
 * This is not meant to be a permenant solution as the need to disable this
 * reveals that there could be an existing issue with useEffect cleanup that is prevent
 * pre-react 18.
 */
// createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <App />,
//   </React.StrictMode>,
// )
async function startApp() {
  if (isWorkflowPrototype) {
    const { startPrototype } =
      await import('./features/admin-form/responses/prototype/bootstrap')
    await startPrototype()
  }
  const { App } = await import('./app/App')
  createRoot(document.getElementById('root')!).render(<App />)
}
void startApp()
