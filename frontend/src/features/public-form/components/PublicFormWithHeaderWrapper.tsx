import { usePublicFormContext } from '../PublicFormContext'

import { FormSectionsProvider } from './FormFields/FormSectionsContext'

export interface PublicFormWithHeaderWrapperProps {
  children: React.ReactNode
}

/**
 * Wrapper for entire public form including header.
 * @precondition Must be nested inside a `PublicFormProvider`
 */
export const PublicFormWithHeaderWrapper = ({
  children,
}: PublicFormWithHeaderWrapperProps): JSX.Element => {
  const { form } = usePublicFormContext()

  return <FormSectionsProvider form={form}>{children}</FormSectionsProvider>
}
