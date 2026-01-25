import create from 'zustand'
import { devtools } from 'zustand/middleware'

export type DirtyWorkflowStore = {
  isDirty: boolean
  setIsDirty: (isDirty: boolean) => void
}

export const useDirtyWorkflowStore = create<DirtyWorkflowStore>()(
  devtools((set) => ({
    isDirty: false,
    setIsDirty: (isDirty: boolean) => set({ isDirty }),
  })),
)

export const isDirtySelector = (
  state: DirtyWorkflowStore,
): DirtyWorkflowStore['isDirty'] => state.isDirty

export const setIsDirtySelector = (
  state: DirtyWorkflowStore,
): DirtyWorkflowStore['setIsDirty'] => state.setIsDirty
