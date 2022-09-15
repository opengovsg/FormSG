import { isEqual } from 'lodash'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { CustomFormLogo, FormLogoBase, FormStartPage } from '~shared/types'

import { UploadedImage } from './BuilderAndDesignDrawer/EditFieldDrawer/edit-fieldtype/EditImage/UploadImageInput'

export type CustomLogoMeta = Omit<CustomFormLogo, keyof FormLogoBase>

export enum DesignState {
  EditingHeader = 1,
  EditingInstructions,
  Inactive,
}

/** Design drawer form input fields. DesignStore keeps track of the data in the
 * drawer input as a single unit. Other data (specifically the logo metadata) is
 * kept separately with its own getters and setters.
 */
export type FormStartPageInput = Omit<
  FormStartPage,
  'logo' | 'estTimeTaken'
> & {
  estTimeTaken: number | ''
  logo: FormLogoBase
  attachment: UploadedImage // Custom logo image
}

export type DesignStore = {
  state: DesignState
  holdingState: DesignState | null
  moveFromHolding: () => void
  clearHoldingState: () => void
  startPageData?: FormStartPageInput
  customLogoMeta?: CustomLogoMeta
  setState: (state: DesignState, holding?: boolean) => void
  setStartPageData: (startPageInput: FormStartPageInput) => void
  setCustomLogoMeta: (customLogoMetaData: CustomLogoMeta) => void
  resetDesignStore: () => void
}

export const useDesignStore = create<DesignStore>()(
  devtools((set, get) => ({
    state: DesignState.Inactive,
    holdingState: null,
    moveFromHolding: () => {
      const holdingStateData = get().holdingState
      if (holdingStateData === null) return
      set({
        state: holdingStateData,
        holdingState: null,
      })
    },
    clearHoldingState: () => set({ holdingState: null }),
    setState: (state, holding) => {
      if (holding) {
        set({ holdingState: state })
      } else {
        set({ state })
      }
    },
    setStartPageData: (startPageData: FormStartPageInput) => {
      const current = get()
      if (isEqual(current.startPageData, startPageData)) return
      set({ startPageData })
    },
    setCustomLogoMeta: (customLogoMeta: CustomLogoMeta) => {
      const current = get()
      if (isEqual(current.customLogoMeta, customLogoMeta)) return
      set({ customLogoMeta })
    },
    resetDesignStore: () => {
      set({
        startPageData: undefined,
        customLogoMeta: undefined,
      })
    },
  })),
)

export const stateSelector = (state: DesignStore): DesignStore['state'] =>
  state.state

export const holdingStateSelector = (
  state: DesignStore,
): DesignStore['holdingState'] => state.holdingState

export const moveFromHoldingSelector = (
  state: DesignStore,
): DesignStore['moveFromHolding'] => state.moveFromHolding

export const startPageDataSelector = (
  state: DesignStore,
): DesignStore['startPageData'] => state.startPageData

export const customLogoMetaSelector = (
  state: DesignStore,
): DesignStore['customLogoMeta'] => state.customLogoMeta

export const setStateSelector = (state: DesignStore): DesignStore['setState'] =>
  state.setState

export const setStartPageDataSelector = (
  state: DesignStore,
): DesignStore['setStartPageData'] => state.setStartPageData

export const setCustomLogoMetaSelector = (
  state: DesignStore,
): DesignStore['setCustomLogoMeta'] => state.setCustomLogoMeta

export const resetDesignStoreSelector = (
  state: DesignStore,
): DesignStore['resetDesignStore'] => state.resetDesignStore
