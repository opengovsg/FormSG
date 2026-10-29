import { useContext, useEffect, useRef } from 'react'
import { UNSAFE_DataRouterContext, useBlocker } from 'react-router-dom'

import { UnsavedChangesModal } from '~templates/NavigationPrompt'

import { saveBeforeNavigation, useNavigationDraft } from './navigationSave'

const RouterNavigationSaveGuard = ({
  fallbackDirty = false,
}: {
  fallbackDirty?: boolean
}) => {
  const draft = useNavigationDraft((state) => state.draft)
  const blocker = useBlocker(!!draft?.dirty || !!draft?.saving || fallbackDirty)
  const handling = useRef(false)
  useEffect(() => {
    if (blocker.state !== 'blocked' || handling.current) return
    // Preserve the existing discard prompt for unrelated field-builder edits.
    if (!draft?.dirty && !draft?.saving) return
    handling.current = true
    void saveBeforeNavigation().then((saved) => {
      handling.current = false
      if (saved) blocker.proceed()
      else blocker.reset()
    })
  }, [blocker, draft])

  if (
    blocker.state !== 'blocked' ||
    draft?.dirty ||
    draft?.saving ||
    !fallbackDirty
  )
    return null

  return (
    <UnsavedChangesModal
      isOpen
      onClose={() => blocker.state === 'blocked' && blocker.reset()}
      onCancel={() => blocker.state === 'blocked' && blocker.reset()}
      onConfirm={() => blocker.state === 'blocked' && blocker.proceed()}
    />
  )
}

/** Keep this mounted across editor saves, because success can close the editor. */
export const NavigationSaveGuard = ({
  fallbackDirty = false,
}: {
  fallbackDirty?: boolean
}) => {
  const draft = useNavigationDraft((state) => state.draft)
  const hasDataRouter = useContext(UNSAFE_DataRouterContext) !== null
  useEffect(() => {
    if (!draft?.dirty && !draft?.saving && !fallbackDirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [draft?.dirty, draft?.saving, fallbackDirty])
  return hasDataRouter ? (
    <RouterNavigationSaveGuard fallbackDirty={fallbackDirty} />
  ) : null
}
