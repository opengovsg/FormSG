import create from 'zustand'

export type MagicFormBuilderStore = {
  recentlyCreatedFieldIds: Set<string>
  setRecentlyCreatedFieldIds: (fieldIds: Set<string>) => void
  clearRecentlyCreatedFieldIds: () => void
}

export const useMagicFormBuilderStore = create<MagicFormBuilderStore>(
  (set) => ({
    recentlyCreatedFieldIds: new Set(),
    setRecentlyCreatedFieldIds: (fieldIds) =>
      set({ recentlyCreatedFieldIds: fieldIds }),
    clearRecentlyCreatedFieldIds: () =>
      set({ recentlyCreatedFieldIds: new Set() }),
  }),
)

export const recentlyCreatedFieldIdsSelector = (
  state: MagicFormBuilderStore,
): MagicFormBuilderStore['recentlyCreatedFieldIds'] =>
  state.recentlyCreatedFieldIds
