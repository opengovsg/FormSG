import { isEqual } from 'lodash'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { FormEndPage } from '~shared/types'

export enum EndPageState {
  EditingEndPage,
  Inactive,
}

export type EndPageStore = {
  state: EndPageState
  holdingState: EndPageState | null
  data?: FormEndPage
  setToEditingEndPage: (holding?: boolean) => void
  setData: (endPage?: FormEndPage) => void
  resetData: () => void
  setToInactive: (holding?: boolean) => void
  clearHoldingState: () => void
  moveFromHolding: () => void
}

export const useEndPageStore = create<EndPageStore>()(
  devtools((set, get) => ({
    state: EndPageState.Inactive,
    holdingState: null,
    moveFromHolding: () => {
      const currentHoldingState = get().holdingState
      if (!currentHoldingState) return
      set({
        state: currentHoldingState,
        holdingState: null,
      })
    },
    clearHoldingState: () => set({ holdingState: null }),
    setToEditingEndPage: (holding) => {
      if (holding) {
        set({ holdingState: EndPageState.EditingEndPage })
      } else {
        set({ state: EndPageState.EditingEndPage })
      }
    },
    setData: (endPage) => {
      const current = get()
      if (isEqual(current.data, endPage)) {
        return
      }
      set({ data: endPage })
    },
    resetData: () => {
      set({
        data: undefined,
      })
    },
    setToInactive: (holding) => {
      if (holding) {
        set({ holdingState: EndPageState.EditingEndPage })
      } else {
        set({
          state: EndPageState.EditingEndPage,
          data: undefined,
        })
      }
    },
  })),
)

export const stateSelector = (state: EndPageStore): EndPageStore['state'] =>
  state.state

export const holdingStateSelector = (
  state: EndPageStore,
): EndPageStore['holdingState'] => state.holdingState

export const dataSelector = (state: EndPageStore): EndPageStore['data'] =>
  state.data

export const setToEditingEndPageSelector = (
  state: EndPageStore,
): EndPageStore['setToEditingEndPage'] => state.setToEditingEndPage

export const setDataSelector = (state: EndPageStore): EndPageStore['setData'] =>
  state.setData

export const resetDataSelector = (
  state: EndPageStore,
): EndPageStore['resetData'] => state.resetData

export const setToInactiveSelector = (
  state: EndPageStore,
): EndPageStore['setToInactive'] => state.setToInactive
