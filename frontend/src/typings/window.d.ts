import type { RumGlobal } from '@datadog/browser-rum'

declare global {
  interface Window {
    DD_RUM: RumGlobal | undefined
  }
}
