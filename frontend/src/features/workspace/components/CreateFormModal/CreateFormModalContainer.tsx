import { CreateFormModal, CreateFormModalProps } from './CreateFormModal'
import { CreateFormWizardProvider } from './CreateFormWizardContext'

export type CreateFormModalContainerProps = CreateFormModalProps

export const CreateFormModalContainer = (
  props: CreateFormModalContainerProps,
): JSX.Element => {
  return (
    <CreateFormWizardProvider>
      <CreateFormModal {...props} />
    </CreateFormWizardProvider>
  )
}
