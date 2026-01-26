import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BiPlus } from 'react-icons/bi'
import { Button } from '@chakra-ui/react'

import { useCreatePageSidebar } from '../../../../common/CreatePageSidebarContext/CreatePageSidebarContext'
import {
  createOrEditDataSelector,
  setToCreatingSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'

export const NewStepBlock = () => {
  const { t } = useTranslation()
  const { formWorkflow } = useAdminFormWorkflow()
  const { stateData, setToCreating } = useAdminWorkflowStore((state) => ({
    stateData: createOrEditDataSelector(state),
    setToCreating: setToCreatingSelector(state),
  }))
  const { handleWorkflowClick } = useCreatePageSidebar()

  const handleAddStep = useCallback(() => {
    // Set creating state
    setToCreating()
    // Ensure drawer opens
    handleWorkflowClick(false, true)
  }, [setToCreating, handleWorkflowClick])

  if (!formWorkflow) return null

  // Hide button when creating or editing a step
  if (stateData) return null
  return (
    <Button onClick={handleAddStep} variant="outline" leftIcon={<BiPlus />}>
      {t('features.adminForm.sidebar.workflow.approvals.addStep')}
    </Button>
  )
}
