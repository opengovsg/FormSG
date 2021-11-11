import { useNavigate } from 'react-router-dom'

import { FormId } from '~shared/types/form/form'

import { ADMINFORM_ROUTE } from '~constants/routes'

export const useRowActionDropdown = (formId: FormId) => {
  const navigate = useNavigate()
  return {
    handleEditForm: () => navigate(`${ADMINFORM_ROUTE}/${formId}`),
    handlePreviewForm: () =>
      console.log(`preview button clicked for ${formId}`),
    handleDuplicateForm: () =>
      console.log(`duplicate form button clicked for ${formId}`),
    handleShareForm: () =>
      console.log(`share form button clicked for ${formId}`),
    handleManageFormAccess: () =>
      console.log(`manage form access button clicked for ${formId}`),
    handleDeleteForm: () =>
      console.log(`delete form  button clicked for ${formId}`),
  }
}
