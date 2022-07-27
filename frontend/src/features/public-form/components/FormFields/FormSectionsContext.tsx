import {
  createContext,
  createRef,
  RefObject,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { BasicField } from '~shared/types/field'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

interface FormSectionsContextProps {
  sectionRefs: Record<string, RefObject<HTMLDivElement>>
  activeSectionId?: string
  setActiveSectionId: (activeId: string) => void
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

  const orderedSectionFieldIds = useMemo(() => {
    if (!form) return
    const sections = form.form_fields
      .filter((f) => f.fieldType === BasicField.Section)
      .map((f) => f._id)
    return form.startPage.paragraph
      ? ['instructions'].concat(sections)
      : sections
  }, [form])
  const [activeSectionId, setActiveSectionId] = useState<string>()

  const isFirstLoad = useRef(false)

  /**
   * Set default active section id on first load of the form.
   */
  useEffect(() => {
    if (isFirstLoad && orderedSectionFieldIds) {
      setActiveSectionId(orderedSectionFieldIds?.[0])
      isFirstLoad.current = false
    }
  }, [orderedSectionFieldIds])

  useEffect(() => {
    if (!form) return
    const nextSectionRefs: Record<string, RefObject<HTMLDivElement>> = {}
    orderedSectionFieldIds?.forEach((id) => {
      nextSectionRefs[id] = createRef()
    })
    setSectionRefs(nextSectionRefs)
  }, [activeSectionId, form, orderedSectionFieldIds])

  return (
    <FormSectionsContext.Provider
      value={{ sectionRefs, activeSectionId, setActiveSectionId }}
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
