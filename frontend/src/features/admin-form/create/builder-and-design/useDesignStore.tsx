import { isEqual } from 'lodash'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { FormColorTheme, FormLogoState, FormStartPage } from '~shared/types'

export type DesignStore = {
  startPageData: FormStartPage
  setState: (startPage: FormStartPage) => void
}

export const useDesignStore = create<DesignStore>(
  devtools((set, get) => ({
    startPageData: {
      logo: { state: FormLogoState.Default },
      colorTheme: FormColorTheme.Blue,
    },
    setState: (startPage) => {
      const current = get()
      if (isEqual(current.startPageData, startPage)) return
      set({
        startPageData: startPage,
      })
    },
  })),
)

export const startPageDataSelector = (
  state: DesignStore,
): DesignStore['startPageData'] => state.startPageData

export const setStateSelector = (state: DesignStore): DesignStore['setState'] =>
  state.setState
