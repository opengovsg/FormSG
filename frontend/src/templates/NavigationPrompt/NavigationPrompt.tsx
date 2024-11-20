import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { UnsavedChangesModal } from './UnsavedChangesModal'
import { useNavigationPrompt } from './useNavigationPrompt'

interface NavigationPromptProps {
  /** Whether modal should appear. */
  when: boolean
  /** Modal header title. Defaults to `"You have unsaved changes"` */
  title?: string
  /**
   * Modal body content.
   * Defaults to `"Are you sure you want to leave? Your changes will be lost."`
   */
  description?: string
  /** Text to display for the confirmation button. Defaults to `"Yes, discard changes"` */
  confirmButtonText?: string
  /** Text to display for the cancel button. Defaults to `"No, stay on page"` */
  cancelButtonText?: string
}
export const NavigationPrompt = memo(
  ({
    when,
    title = 'You have unsaved changes',
    description = 'Are you sure you want to leave? Your changes will be lost.',
    confirmButtonText = 'Yes, discard changes',
    cancelButtonText = 'No, stay on page',
  }: NavigationPromptProps) => {
    const { t } = useTranslation()
    const { isPromptShown, onCancel, onConfirm } = useNavigationPrompt(when)

    const defaultText = t('features.adminForm.modals.unsavedChanges', {
      returnObjects: true,
    })

    return (
      <UnsavedChangesModal
        onCancel={onCancel}
        onConfirm={onConfirm}
        isOpen={isPromptShown}
        onClose={onCancel}
        confirmButtonText={confirmButtonText}
        cancelButtonText={cancelButtonText}
        title={title}
        description={description}
      />
    )
  },
)
