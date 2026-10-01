import 'react-i18next'

import { enSG } from './locales/en-sg'
import type {
  Workflow,
  workflowNs,
} from './locales/features/admin-form/sidebar/workflow'

declare module 'react-i18next' {
  interface CustomTypeOptions {
    // One entry per namespace registered with `registerNamespace`, so `t`
    // from `useTranslation(ns)` only accepts that namespace's keys.
    resources: typeof enSG & Record<typeof workflowNs, Workflow>
  }
}
