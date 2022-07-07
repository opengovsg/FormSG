import { isEqual } from 'lodash'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { FormEndPage } from '~shared/types'

export type EndPageBuilderStore = {
  endPageData: FormEndPage
  setState: (endPage: FormEndPage) => void
}

export const useEndPageBuilderStore = create<EndPageBuilderStore>(
  devtools((set, get) => ({
    endPageData: {
      title: 'Thank you for your response.',
      paragraph: '',
      buttonText: 'Submit another form',
      buttonLink: '',
    },
    setState: (endPage) => {
      const current = get()
      if (isEqual(current.endPageData, endPage)) return
      set({
        endPageData: endPage,
      })
    },
  })),
)

export const endPageDataSelector = (
  state: EndPageBuilderStore,
): EndPageBuilderStore['endPageData'] => state.endPageData

export const setStateSelector = (
  state: EndPageBuilderStore,
): EndPageBuilderStore['setState'] => state.setState
