import {
  createContext,
  createRef,
  RefObject,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import useScrollSpy from 'react-use-scrollspy'

import { BasicField, FormFieldDto, Language } from '~shared/types'

import { FieldIdSet } from '~features/logic/types'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { PUBLICFORM_INSTRUCTIONS_SECTIONID } from '../FormInstructions/FormInstructionsContainer'

export type SidebarSectionMeta = Pick<
  FormFieldDto,
  'title' | '_id' | 'titleTranslations'
>

interface FormSectionsContextProps {
  /** Scroll data to allow form-fillers to scroll to a particular section. */
  sectionScrollData: SidebarSectionMeta[]
  setVisibleFieldIdsForScrollData: (visibleFieldIds: FieldIdSet) => void
  sectionRefs: Record<string, RefObject<HTMLDivElement>>
  activeSectionId?: string
  navigatedSectionId?: string
  setNavigatedSectionId: (id: string) => void
}

const FormSectionsContext = createContext<FormSectionsContextProps | undefined>(
  undefined,
)

interface FormSectionsProviderProps {
  children: React.ReactNode
}

export const FormSectionsProvider = ({
  children,
}: FormSectionsProviderProps): JSX.Element => {
  const { t, i18n } = useTranslation()
  const { form, isAuthRequired } = usePublicFormContext()

  useEffect(() => {
    // On page load render, if the form does not support multi-langugage
    // set the language preference to be English.
    if (!form?.hasMultiLang) {
      i18n.changeLanguage(Language.ENGLISH)
    }
  }, [form?.hasMultiLang, i18n])

  const [visibleFieldIds, setVisibleFieldIds] = useState<FieldIdSet>()

  const sectionScrollData = useMemo(() => {
    if (!form || isAuthRequired) return []
    const sections: SidebarSectionMeta[] = []
    if (form.startPage.paragraph)
      sections.push({
        title: t('features.publicForm.components.instructions.title'),
        titleTranslations: [],
        _id: PUBLICFORM_INSTRUCTIONS_SECTIONID,
      })
    form.form_fields.forEach((f) => {
      if (f.fieldType !== BasicField.Section || !visibleFieldIds?.has(f._id))
        return
      sections.push({
        title: f.title,
        titleTranslations: f.titleTranslations,
        _id: f._id,
      })
    })
    return sections
  }, [form, isAuthRequired, visibleFieldIds, t])

  const [sectionRefs, setSectionRefs] = useState<
    Record<string, RefObject<HTMLDivElement>>
  >({})
  const [sectionRefsArr, setSectionRefsArr] = useState<
    RefObject<HTMLDivElement>[]
  >([])

  const orderedSectionFieldIds = useMemo(() => {
    if (!form) return
    const sections = form.form_fields
      .filter((f) => f.fieldType === BasicField.Section)
      .map((f) => f._id)
    return form.startPage.paragraph
      ? [PUBLICFORM_INSTRUCTIONS_SECTIONID].concat(sections)
      : sections
  }, [form])
  const [navigatedSectionId, setNavigatedSectionId] = useState<string>()

  useEffect(() => {
    if (!form) return
    const nextSectionRefs: Record<string, RefObject<HTMLDivElement>> = {}
    const nextSectionRefsArr: RefObject<HTMLDivElement>[] = []
    orderedSectionFieldIds?.forEach((id) => {
      const sectionRef = createRef<HTMLDivElement>()
      nextSectionRefs[id] = sectionRef
      nextSectionRefsArr.push(sectionRef)
    })
    setSectionRefs(nextSectionRefs)
    setSectionRefsArr(nextSectionRefsArr)
  }, [form, orderedSectionFieldIds])

  const activeSection = useScrollSpy({
    sectionElementRefs: sectionRefsArr,
    // Seems to give the best results with this offset.
    // Correctly switches the active section when the user navigates to the section.
    offsetPx: -100,
  })

  return (
    <FormSectionsContext.Provider
      value={{
        sectionScrollData,
        setVisibleFieldIdsForScrollData: setVisibleFieldIds,
        sectionRefs,
        activeSectionId: orderedSectionFieldIds?.[activeSection] ?? undefined,
        navigatedSectionId,
        setNavigatedSectionId,
      }}
    >
      {children}
    </FormSectionsContext.Provider>
  )
}

export const useFormSections = (): FormSectionsContextProps => {
  const context = useContext(FormSectionsContext)
  if (!context) {
    throw new Error(
      `useFormSections must be used within a FormSectionsProvider component`,
    )
  }
  return context
}
