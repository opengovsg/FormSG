import { CreateFormModal, DeleteFormModal } from './forms'
import {
  CreateWorkspaceModal,
  DeleteWorkspaceModal,
  RenameWorkspaceModal,
} from './workspace'

export interface Modals {
  forms: {
    create: CreateFormModal
    delete: DeleteFormModal
  }
  workspace: {
    create: CreateWorkspaceModal
    delete: DeleteWorkspaceModal
    rename: RenameWorkspaceModal
  }
}

export * from './en-sg'
