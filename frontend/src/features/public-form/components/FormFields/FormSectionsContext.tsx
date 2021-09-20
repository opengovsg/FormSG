import {
  createContext,
  createRef,
  RefObject,
  useContext,
  useEffect,
  useState,
} from 'react'

import { BasicField } from '~shared/types/field'

import { usePublicForm } from '~features/public-form/queries'

interface FormSectionsContextProps {
  sectionRefs: Record<string, RefObject<HTMLDivElement>>
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

  useEffect(() => {
    if (!data) return
    const nextSectionRefs: Record<string, RefObject<HTMLDivElement>> = {}
    data.form_fields.forEach((f) => {
      if (f.fieldType !== BasicField.Section) return
      nextSectionRefs[f._id] = createRef()
    })
    setSectionRefs(nextSectionRefs)
  }, [data])

  return (
    <FormSectionsContext.Provider value={{ sectionRefs }}>
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
