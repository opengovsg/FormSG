export * from './en-sg'

export interface DeleteWorkspaceModal {
  title: string
  confirmation: {
    removeForms: string
    removeWorkspace: string
  }
  confirmDeletion: string
}
