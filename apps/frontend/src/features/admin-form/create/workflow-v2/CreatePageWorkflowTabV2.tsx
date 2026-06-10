import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { useAdminForm } from '~features/admin-form/common/queries'

import { CreatePageDrawerContainer } from '../common/CreatePageDrawer'
import { CreatePageSideBarLayoutProvider } from '../common/CreatePageSideBarLayoutContext'

import { FormCanvas } from './components/FormCanvas'
import { WorkflowPanel } from './components/WorkflowPanel'
import type { FormField } from './types'
import { useWorkflowBuilderStore } from './workflowBuilderStore'

export const CreatePageWorkflowTabV2 = (): JSX.Element => {
  const { formId } = useParams()
  const loadForForm = useWorkflowBuilderStore((s) => s.loadForForm)
  const syncFields = useWorkflowBuilderStore((s) => s.syncFields)
  const { data: form } = useAdminForm()

  // Load form-scoped store state on mount
  useEffect(() => {
    if (formId) loadForForm(formId)
  }, [formId, loadForForm])

  // Sync real form fields into the store so step assignments can reference them
  const storeFields: FormField[] = useMemo(() => {
    if (!form?.form_fields) return []
    return form.form_fields.map((f, i) => ({
      id: f._id,
      name: f.title,
      fieldType: f.fieldType as FormField['fieldType'],
      number: i + 1,
    }))
  }, [form?.form_fields])

  useEffect(() => {
    if (storeFields.length > 0) {
      syncFields(storeFields)
    }
  }, [storeFields, syncFields])

  // Render drawer + canvas as siblings (no wrapper Flex)
  // so they participate in the parent Flex from CreatePage.tsx
  return (
    <>
      <CreatePageSideBarLayoutProvider>
        <CreatePageDrawerContainer>
          <WorkflowPanel />
        </CreatePageDrawerContainer>
      </CreatePageSideBarLayoutProvider>
      <FormCanvas />
    </>
  )
}
