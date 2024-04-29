import 'inter-ui/inter.css'
import './i18n/i18n'
import './polyfills'

import * as React from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app/App'
import * as dayjs from './utils/dayjs'

if (import.meta.env.NODE_ENV === 'test') {
  import('./mocks/msw/browser').then(({ worker }) => worker.start())
}

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
gtag('config', import.meta.env.VITE_APP_GA_TRACKING_ID || '')
window.gtag = gtag

// Init dayjs
dayjs.init()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
