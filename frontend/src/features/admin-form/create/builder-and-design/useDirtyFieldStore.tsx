import create from 'zustand'
import { devtools } from 'zustand/middleware'

export type DirtyFieldStore = {
  isDirty: boolean
  setIsDirty: (isDirty: boolean) => void
}

export const useDirtyFieldStore = create<DirtyFieldStore>()(
  devtools((set, _get) => ({
    isDirty: false,
    setIsDirty: (isDirty: boolean) => set({ isDirty }),
  })),
)

export const isDirtySelector = (
  state: DirtyFieldStore,
): DirtyFieldStore['isDirty'] => state.isDirty

export const setIsDirtySelector = (
  state: DirtyFieldStore,
): DirtyFieldStore['setIsDirty'] => state.setIsDirty
