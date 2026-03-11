import create from 'zustand'

export type MagicFormBuilderStore = {
  recentlyCreatedFieldIds: {
    [formId: string]: Set<string>
  }
  clearRecentlyCreatedFieldIds: (formId: string) => void
}

export const useMagicFormBuilderStore = create<MagicFormBuilderStore>(
  (set) => ({
    recentlyCreatedFieldIds: {},
    clearRecentlyCreatedFieldIds: (formId) =>
      set((state) => ({
        recentlyCreatedFieldIds: Object.fromEntries(
          Object.entries(state.recentlyCreatedFieldIds).filter(
            ([fid]) => fid !== formId,
          ),
        ),
      })),
  }),
)

export const recentlyCreatedFieldIdsSelector = (
  state: MagicFormBuilderStore,
): MagicFormBuilderStore['recentlyCreatedFieldIds'] =>
  state.recentlyCreatedFieldIds
