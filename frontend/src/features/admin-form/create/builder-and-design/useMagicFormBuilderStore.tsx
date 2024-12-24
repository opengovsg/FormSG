import create from 'zustand'

export type MagicFormBuilderStore = {
  isAcceptDenyOpen: boolean
  recentlyCreatedFieldIds: Set<string>
  setRecentlyCreatedFieldIds: (fieldIds: Set<string>) => void
  clearRecentlyCreatedFieldIds: () => void
}

export const useMagicFormBuilderStore = create<MagicFormBuilderStore>(
  (set, get) => ({
    isAcceptDenyOpen: get().recentlyCreatedFieldIds.size > 0,
    recentlyCreatedFieldIds: new Set(),
    setRecentlyCreatedFieldIds: (fieldIds) =>
      set({ recentlyCreatedFieldIds: fieldIds }),
    clearRecentlyCreatedFieldIds: () =>
      set({ recentlyCreatedFieldIds: new Set() }),
  }),
)

export const isAcceptDenyOpenSelector = (
  state: MagicFormBuilderStore,
): MagicFormBuilderStore['isAcceptDenyOpen'] => state.isAcceptDenyOpen

export const recentlyCreatedFieldIdsSelector = (
  state: MagicFormBuilderStore,
): MagicFormBuilderStore['recentlyCreatedFieldIds'] =>
  state.recentlyCreatedFieldIds
