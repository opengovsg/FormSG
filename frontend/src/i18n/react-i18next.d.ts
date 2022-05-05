import 'react-i18next'

import { enSG } from './locales/en-sg'

declare module 'react-i18next' {
  interface CustomTypeOptions {
    resources: typeof enSG
  }
}
