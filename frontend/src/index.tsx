import 'inter-ui/inter.css'
import 'focus-visible/dist/focus-visible.min.js'
import './i18n/i18n'
import './polyfills'

import * as React from 'react'
import ReactDOM from 'react-dom'

import { App } from './app/App'
import * as dayjs from './utils/dayjs'
import reportWebVitals from './reportWebVitals'
import * as serviceWorker from './serviceWorker'

if (process.env.NODE_ENV === 'test') {
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
gtag('config', process.env.REACT_APP_GA_TRACKING_ID || '')
window.gtag = gtag

// Init dayjs
dayjs.init()

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorker.unregister()

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
