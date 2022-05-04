import { useNavigate } from 'react-router-dom'
import { useDisclosure } from '@chakra-ui/react'

import { FormId } from '~shared/types/form/form'

import { ADMINFORM_ROUTE } from '~constants/routes'

type UseRowActionDropdownReturn = {
  handleEditForm: () => void
  handlePreviewForm: () => void
  handleDuplicateForm: () => void
  handleManageFormAccess: () => void
  handleDeleteForm: () => void
  shareFormModalDisclosure: ReturnType<typeof useDisclosure>
}

export const useRowActionDropdown = (
  formId: FormId,
): UseRowActionDropdownReturn => {
  const navigate = useNavigate()

  const shareFormModalDisclosure = useDisclosure()

  return {
    shareFormModalDisclosure,
    handleEditForm: () => navigate(`${ADMINFORM_ROUTE}/${formId}`),
    handlePreviewForm: () =>
      console.log(`preview button clicked for ${formId}`),
    handleDuplicateForm: () =>
      console.log(`duplicate form button clicked for ${formId}`),
    handleManageFormAccess: () =>
      console.log(`manage form access button clicked for ${formId}`),
    handleDeleteForm: () =>
      console.log(`delete form  button clicked for ${formId}`),
  }
}
