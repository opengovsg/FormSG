export const enSG = {
  deleteField: {
    title: 'Delete field',
    description: {
      field:
        'Are you sure you want to delete this field? This action cannot be undone.',
      logic:
        'This field is used in your form logic, so deleting it may cause your logic to stop working correctly. Are you sure you want to delete this field?',
      payment:
        "Are you sure you want to delete payment field? This action can't be undone.",
    },
    confirmButtonText: 'Yes, delete field',
  },
  unsavedChanges: {
    title: 'You have unsaved changes',
    description: 'Are you sure you want to leave? Your changes will be lost.',
    confirmButtonText: 'Yes, discard changes',
    cancelButtonText: 'No, stay on page',
  },
  dirty: {
    cancelButtonText: 'No, return to editing',
  },
}
