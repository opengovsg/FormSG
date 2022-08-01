import {
  createContext,
  createRef,
  RefObject,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import useScrollSpy from 'react-use-scrollspy'

import { BasicField } from '~shared/types/field'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

interface FormSectionsContextProps {
  sectionRefs: Record<string, RefObject<HTMLDivElement>>
  activeSectionId?: string
  navigatedSectionTitle?: string
  setNavigatedSectionTitle: (title: string) => void
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
  const { form } = usePublicFormContext()
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
      ? ['instructions'].concat(sections)
      : sections
  }, [form])
  const [navigatedSectionTitle, setNavigatedSectionTitle] = useState<string>()

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
        sectionRefs,
        activeSectionId: orderedSectionFieldIds?.[activeSection] ?? undefined,
        navigatedSectionTitle,
        setNavigatedSectionTitle,
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
