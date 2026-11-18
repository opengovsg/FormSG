import { useEffect, useRef } from 'react'
import create from 'zustand'

type NavigationDraft = {
  owner: symbol
  dirty: boolean
  saving: boolean
  save: () => Promise<boolean>
}

export const useNavigationDraft = create<{ draft: NavigationDraft | null }>(
  () => ({
    draft: null,
  }),
)

let pendingSave: Promise<boolean> | null = null

/** One mounted workflow/authentication editor owns the current draft. */
export const useRegisterNavigationSave = ({
  enabled = true,
  isDirty,
  isSaving = false,
  save,
}: {
  enabled?: boolean
  isDirty: boolean
  isSaving?: boolean
  save: () => Promise<boolean>
}) => {
  const owner = useRef(Symbol('navigation-draft'))
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => {
    if (!enabled) return
    const ownerId = owner.current
    useNavigationDraft.setState({
      draft: {
        owner: ownerId,
        dirty: isDirty,
        saving: isSaving,
        save: () => saveRef.current(),
      },
    })
    return () => {
      if (useNavigationDraft.getState().draft?.owner === ownerId)
        useNavigationDraft.setState({ draft: null })
    }
  }, [enabled, isDirty, isSaving])
}

/** Share an in-flight navigation save so repeated clicks cannot duplicate writes. */
export const saveBeforeNavigation = (): Promise<boolean> => {
  if (pendingSave) return pendingSave
  const draft = useNavigationDraft.getState().draft
  if (!draft?.dirty) return Promise.resolve(!draft?.saving)
  if (draft.saving) return Promise.resolve(false)
  pendingSave = Promise.resolve()
    .then(() => draft.save())
    .catch(() => false)
    .finally(() => {
      pendingSave = null
    })
  return pendingSave
}
