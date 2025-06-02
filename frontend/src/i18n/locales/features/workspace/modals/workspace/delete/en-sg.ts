import { DeleteWorkspaceModal } from '.'

export const enSG: DeleteWorkspaceModal = {
  title: 'Delete folder',
  confirmation: {
    removeForms:
      'Remove {formsInActiveWorkspace} form{formsInActiveWorkspace, plural, =1 {} other {(s)}} from {activeWorkspaceTitle} and delete the folder? This action cannot be undone',
    removeWorkspace:
      'Are you sure you want to delete this folder? This action cannot be undone.',
  },
  confirmDeletion: 'Yes, delete folder',
}
