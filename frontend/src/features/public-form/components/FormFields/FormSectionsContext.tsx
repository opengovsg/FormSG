import {
  createContext,
  createRef,
  RefObject,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { BasicField } from '~shared/types/field'

import { usePublicForm } from '~features/public-form/queries'

interface FormSectionsContextProps {
  sectionRefs: Record<string, RefObject<HTMLDivElement>>
  activeSectionId?: string
  setActiveSectionId: (activeId: string) => void
}

const FormSectionsContext = createContext<FormSectionsContextProps | undefined>(
  undefined,
)

export const FormSectionsProvider = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  const { data } = usePublicForm()
  const [sectionRefs, setSectionRefs] = useState<
    Record<string, RefObject<HTMLDivElement>>
  >({})

  const orderedSectionFields = useMemo(
    () => data?.form_fields.filter((f) => f.fieldType === BasicField.Section),
    [data],
  )
  const [activeSectionId, setActiveSectionId] = useState<string | undefined>(
    orderedSectionFields?.[0]._id,
  )

  useEffect(() => {
    if (!data) return
    const nextSectionRefs: Record<string, RefObject<HTMLDivElement>> = {}
    orderedSectionFields?.forEach((f) => {
      nextSectionRefs[f._id] = createRef()
    })
    setSectionRefs(nextSectionRefs)
  }, [activeSectionId, data, orderedSectionFields])

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
