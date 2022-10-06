import { isEqual } from 'lodash'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { FormEndPage } from '~shared/types'

export type EndPageBuilderStore = {
  endPageData: FormEndPage | null
  setEndPageData: (endPage: FormEndPage) => void
  resetEndPageData: () => void
}

export const useEndPageBuilderStore = create<EndPageBuilderStore>()(
  devtools((set, get) => ({
    endPageData: {
      title: 'Thank you for your response.',
      paragraph: '',
      buttonText: 'Submit another form',
      buttonLink: '',
    },
    setEndPageData: (endPage) => {
      const current = get()
      if (isEqual(current.endPageData, endPage)) return
      set({
        endPageData: endPage,
      })
    },
    resetEndPageData: () => {
      set({ endPageData: null })
    },
  })),
)

export const endPageDataSelector = (
  state: EndPageBuilderStore,
): EndPageBuilderStore['endPageData'] => state.endPageData

export const setEndPageDataSelector = (
  state: EndPageBuilderStore,
): EndPageBuilderStore['setEndPageData'] => state.setEndPageData

export const resetEndPageDataSelector = (
  state: EndPageBuilderStore,
): EndPageBuilderStore['resetEndPageData'] => state.resetEndPageData
