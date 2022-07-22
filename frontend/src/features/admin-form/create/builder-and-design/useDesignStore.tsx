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
  startPageData?: FormStartPageInput
  customLogoMeta?: CustomLogoMeta
  setStartPageData: (startPageInput: FormStartPageInput) => void
  setAttachment: (attachment: UploadedImage) => void
  setCustomLogoMeta: (customLogoMetaData: CustomLogoMeta) => void
  resetCustomLogoMeta: () => void
  resetDesignStore: () => void
}

export const useDesignStore = create<DesignStore>(
  devtools((set, get) => ({
    setStartPageData: (startPageData: FormStartPageInput) => {
      const current = get()
      if (isEqual(current.startPageData, startPageData)) return
      set({ startPageData })
    },
    setAttachment: (attachment: UploadedImage) => {
      const current = get()
      if (!current.startPageData) return
      if (isEqual(current.startPageData?.attachment, attachment)) return
      set({
        startPageData: {
          ...current.startPageData,
          attachment,
        },
      })
    },
    setCustomLogoMeta: (customLogoMeta: CustomLogoMeta) => {
      const current = get()
      if (isEqual(current.customLogoMeta, customLogoMeta)) return
      set({ customLogoMeta })
    },
    resetCustomLogoMeta: () => {
      set({ customLogoMeta: undefined })
    },
    resetDesignStore: () => {
      set({
        startPageData: undefined,
        customLogoMeta: undefined,
      })
    },
  })),
)

export const startPageDataSelector = (
  state: DesignStore,
): DesignStore['startPageData'] => state.startPageData

export const customLogoMetaSelector = (
  state: DesignStore,
): DesignStore['customLogoMeta'] => state.customLogoMeta

export const setStartPageDataSelector = (
  state: DesignStore,
): DesignStore['setStartPageData'] => state.setStartPageData

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
