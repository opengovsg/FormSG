import { isEqual } from 'lodash'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { FormStartPage } from '~shared/types'

export type DesignStore = {
  startPageData: FormStartPage | null
  setStartPageData: (startPage: FormStartPage) => void
  resetStartPageData: () => void
}

export const useDesignStore = create<DesignStore>(
  devtools((set, get) => ({
    startPageData: null,
    setStartPageData: (startPage) => {
      const current = get()
      if (isEqual(current.startPageData, startPage)) return
      set({
        startPageData: startPage,
      })
    },
    resetStartPageData: () => {
      set({ startPageData: null })
    },
  })),
)

export const startPageDataSelector = (
  state: DesignStore,
): DesignStore['startPageData'] => state.startPageData

export const setStartPageDataSelector = (
  state: DesignStore,
): DesignStore['setStartPageData'] => state.setStartPageData

export const resetStartPageDataSelector = (
  state: DesignStore,
): DesignStore['resetStartPageData'] => state.resetStartPageData
