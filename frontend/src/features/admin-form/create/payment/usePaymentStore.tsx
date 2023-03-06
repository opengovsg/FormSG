import { isEqual } from 'lodash'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { FormPayments } from '~shared/types'

export enum PaymentState {
  EditingPayment,
  Inactive,
}

export type PaymentStore = {
  state: PaymentState
  holdingState: PaymentState | null
  data: FormPayments
  setToEditingPayment: (holding?: boolean) => void
  setData: (payment?: FormPayments) => void
  resetData: () => void
  setToInactive: (holding?: boolean) => void
  clearHoldingState: () => void
  moveFromHolding: () => void
}

export const usePaymentStore = create<PaymentStore>()(
  devtools((set, get) => ({
    state: PaymentState.Inactive,
    holdingState: null,
    data: { enabled: false } as FormPayments,
    moveFromHolding: () => {
      const currentHoldingState = get().holdingState
      if (!currentHoldingState) return
      set({
        state: currentHoldingState,
        holdingState: null,
      })
    },
    clearHoldingState: () => set({ holdingState: null }),
    setToEditingPayment: (holding) => {
      if (holding) {
        set({ holdingState: PaymentState.EditingPayment })
      } else {
        set({ state: PaymentState.EditingPayment })
      }
    },
    setData: (payment) => {
      const current = get()
      if (isEqual(current.data, payment)) {
        return
      }
      set({ data: payment })
    },
    resetData: () => {
      set({
        data: undefined,
      })
    },
    setToInactive: (holding) => {
      if (holding) {
        set({ holdingState: PaymentState.EditingPayment })
      } else {
        set({
          state: PaymentState.EditingPayment,
          data: undefined,
        })
      }
    },
  })),
)

export const stateSelector = (state: PaymentStore): PaymentStore['state'] =>
  state.state

export const holdingStateSelector = (
  state: PaymentStore,
): PaymentStore['holdingState'] => state.holdingState

export const dataSelector = (state: PaymentStore): PaymentStore['data'] =>
  state.data

export const setToEditingPaymentSelector = (
  state: PaymentStore,
): PaymentStore['setToEditingPayment'] => state.setToEditingPayment

export const setDataSelector = (state: PaymentStore): PaymentStore['setData'] =>
  state.setData

export const resetDataSelector = (
  state: PaymentStore,
): PaymentStore['resetData'] => state.resetData

export const setToInactiveSelector = (
  state: PaymentStore,
): PaymentStore['setToInactive'] => state.setToInactive
