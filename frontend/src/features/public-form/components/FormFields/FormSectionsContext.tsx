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
import { PublicFormDto } from '~shared/types/form'

interface FormSectionsContextProps {
  sectionRefs: Record<string, RefObject<HTMLDivElement>>
  activeSectionId?: string
  setActiveSectionId: (activeId: string) => void
}

const FormSectionsContext = createContext<FormSectionsContextProps | undefined>(
  undefined,
)

interface FormSectionsProviderProps {
  form?: PublicFormDto
  children: React.ReactNode
}

export const FormSectionsProvider = ({
  form,
  children,
}: FormSectionsProviderProps): JSX.Element => {
  const [sectionRefs, setSectionRefs] = useState<
    Record<string, RefObject<HTMLDivElement>>
  >({})

  const orderedSectionFields = useMemo(
    () => form?.form_fields.filter((f) => f.fieldType === BasicField.Section),
    [form],
  )
  const [activeSectionId, setActiveSectionId] = useState<string>()

  const isFirstLoad = useRef(false)

  /**
   * Set default active section id on first load of the form.
   */
  useEffect(() => {
    if (isFirstLoad && orderedSectionFields) {
      setActiveSectionId(orderedSectionFields[0]?._id)
      isFirstLoad.current = false
    }
  }, [orderedSectionFields])

  useEffect(() => {
    if (!form) return
    const nextSectionRefs: Record<string, RefObject<HTMLDivElement>> = {}
    orderedSectionFields?.forEach((f) => {
      nextSectionRefs[f._id] = createRef()
    })
    setSectionRefs(nextSectionRefs)
  }, [activeSectionId, form, orderedSectionFields])

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
