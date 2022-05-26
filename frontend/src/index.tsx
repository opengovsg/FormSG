import 'focus-visible/dist/focus-visible.min.js'
import './assets/fonts/inter.css'
import './i18n/i18n'

import * as React from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app/App'
import * as dayjs from './utils/dayjs'
import reportWebVitals from './reportWebVitals'
import * as serviceWorker from './serviceWorker'

if (process.env.NODE_ENV === 'test') {
  import('./mocks/msw/browser').then(({ worker }) => worker.start())
}

// Init dayjs
dayjs.init()

const container = document.getElementById('root')
// Will always exist.
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorker.unregister()

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
