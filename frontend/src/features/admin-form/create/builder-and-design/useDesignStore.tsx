import { isEqual } from 'lodash'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { CustomFormLogo, FormLogoBase, FormStartPage } from '~shared/types'

import { UploadedImage } from './BuilderAndDesignDrawer/EditFieldDrawer/edit-fieldtype/EditImage/UploadImageInput'

export type CustomLogoMeta = Omit<CustomFormLogo, keyof FormLogoBase>

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
  startPageInputData?: FormStartPageInput
  customLogoMeta?: CustomLogoMeta
  setStartPageInputData: (startPageInput: FormStartPageInput) => void
  setAttachment: (attachment: UploadedImage) => void
  setCustomLogoMeta: (customLogoMetaData: CustomLogoMeta) => void
  resetCustomLogoMeta: () => void
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
    setAttachment: (attachment: UploadedImage) => {
      const current = get()
      if (!current.startPageInputData) return
      if (isEqual(current.startPageInputData?.attachment, attachment)) return
      set({
        startPageInputData: {
          ...current.startPageInputData,
          attachment,
        },
      })
    },
    setCustomLogoMeta: (customLogoMeta: CustomLogoMeta) => {
      const current = get()
      if (isEqual(current.customLogoMeta, customLogoMeta)) return
      set({
        customLogoMeta: customLogoMeta,
      })
    },
    resetCustomLogoMeta: () => {
      set({ customLogoMeta: undefined })
    },
    resetDesignStore: () => {
      set({
        startPageInputData: undefined,
        customLogoMeta: undefined,
      })
    },
  })),
)

export const startPageInputDataSelector = (
  state: DesignStore,
): DesignStore['startPageInputData'] => state.startPageInputData

export const customLogoMetaSelector = (
  state: DesignStore,
): DesignStore['customLogoMeta'] => state.customLogoMeta

export const setStartPageInputDataSelector = (
  state: DesignStore,
): DesignStore['setStartPageInputData'] => state.setStartPageInputData

export const setAttachmentSelector = (
  state: DesignStore,
): DesignStore['setAttachment'] => state.setAttachment

export const setCustomLogoMetaSelector = (
  state: DesignStore,
): DesignStore['setCustomLogoMeta'] => state.setCustomLogoMeta

export const resetCustomLogoMetaSelector = (
  state: DesignStore,
): DesignStore['resetCustomLogoMeta'] => state.resetCustomLogoMeta

export const resetDesignStoreSelector = (
  state: DesignStore,
): DesignStore['resetDesignStore'] => state.resetDesignStore
