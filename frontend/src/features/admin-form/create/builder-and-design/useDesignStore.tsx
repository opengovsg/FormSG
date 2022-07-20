import { isEqual } from 'lodash'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { CustomFormLogo, FormLogoBase, FormStartPage } from '~shared/types'

import { UploadedImage } from './BuilderAndDesignDrawer/EditFieldDrawer/edit-fieldtype/EditImage/UploadImageInput'

export type CustomLogoMeta = Omit<CustomFormLogo, keyof FormLogoBase>

/** Design drawer form input fields. DesignStore keeps track of the data in the
 * drawer input as a single unit. Other data (specifically the logo metadata)
 * kept separately with its own getters and setters.
 */
export type FormStartPageInput = Omit<
  FormStartPage,
  'logo' | 'estTimeTaken'
> & {
  estTimeTaken: number | ''
  logo: FormLogoBase
  customLogoFile: UploadedImage
}

export type DesignStore = {
  startPageInputData?: FormStartPageInput
  customLogoMetaData?: CustomLogoMeta
  setStartPageInputData: (startPageInput: FormStartPageInput) => void
  setCustomLogoFile: (customLogoFile: UploadedImage) => void
  setCustomLogoMetaData: (customLogoMetaData: CustomLogoMeta) => void
  resetCustomLogoMetaData: () => void
  resetDesignStore: () => void
}

export const useDesignStore = create<DesignStore>(
  devtools((set, get) => ({
    setStartPageInputData: (startPageInput: FormStartPageInput) => {
      const current = get()
      if (isEqual(current.startPageInputData, startPageInput)) return
      set({
        startPageInputData: startPageInput,
      })
    },
    setCustomLogoFile: (customLogoFile: UploadedImage) => {
      const current = get()
      if (!current.startPageInputData) return
      if (isEqual(current.startPageInputData?.customLogoFile, customLogoFile))
        return
      set({
        startPageInputData: {
          ...current.startPageInputData,
          customLogoFile: customLogoFile,
        },
      })
    },
    setCustomLogoMetaData: (customLogoMeta: CustomLogoMeta) => {
      const current = get()
      if (isEqual(current.customLogoMetaData, customLogoMeta)) return
      set({
        customLogoMetaData: customLogoMeta,
      })
    },
    resetCustomLogoMetaData: () => {
      set({ customLogoMetaData: undefined })
    },
    resetDesignStore: () => {
      set({
        startPageInputData: undefined,
        customLogoMetaData: undefined,
      })
    },
  })),
)

export const startPageInputDataSelector = (
  state: DesignStore,
): DesignStore['startPageInputData'] => state.startPageInputData

export const customLogoMetaDataSelector = (
  state: DesignStore,
): DesignStore['customLogoMetaData'] => state.customLogoMetaData

export const setStartPageInputDataSelector = (
  state: DesignStore,
): DesignStore['setStartPageInputData'] => state.setStartPageInputData

export const setCustomLogoFileSelector = (
  state: DesignStore,
): DesignStore['setCustomLogoFile'] => state.setCustomLogoFile

export const setCustomLogoMetaDataSelector = (
  state: DesignStore,
): DesignStore['setCustomLogoMetaData'] => state.setCustomLogoMetaData

export const resetCustomLogoMetaDataSelector = (
  state: DesignStore,
): DesignStore['resetCustomLogoMetaData'] => state.resetCustomLogoMetaData

export const resetDesignStoreSelector = (
  state: DesignStore,
): DesignStore['resetDesignStore'] => state.resetDesignStore
