import i18n from 'i18next'
import { PartialDeep } from 'type-fest'

import { Language } from 'formsg-shared/types/form/form_enums'

/**
 * Registers a namespace's translations on the shared i18next instance and
 * returns the namespace name to pass to `useTranslation`.
 *
 * Components import the namespace they render instead of reaching for keys in
 * the global `translation` namespace. That import is what lets TurboSnap trace
 * a locale file to the stories that render it; the global aggregate is only
 * reachable through `.storybook/preview.tsx`, so any change to it re-captures
 * every story.
 *
 * Every namespace must also be added to `CustomTypeOptions` in
 * `react-i18next.d.ts` so its keys are typed.
 */
export const registerNamespace = <N extends string, T>(
  ns: N,
  resources: { [Language.ENGLISH]: T } & Partial<
    Record<Language, PartialDeep<T>>
  >,
): N => {
  const add = () =>
    Object.entries(resources).forEach(([lng, bundle]) =>
      i18n.addResourceBundle(lng, ns, bundle),
    )
  // `init` replaces the resource store, so re-register after every init, not
  // only the first. Covers this module loading before `i18n.ts` runs, too.
  i18n.on('initialized', add)
  if (i18n.isInitialized) add()
  return ns
}
