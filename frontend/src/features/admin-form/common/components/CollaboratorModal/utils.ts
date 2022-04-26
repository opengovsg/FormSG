import { FormPermission } from '~shared/types/form/form'

import { DropdownRole } from './AddCollaboratorInput'

export const permissionsToRole = (permission: FormPermission): DropdownRole => {
  return permission.write ? DropdownRole.Editor : DropdownRole.Viewer
}

export const roleToPermission = (
  role: DropdownRole,
): Omit<FormPermission, 'email'> => {
  switch (role) {
    case DropdownRole.Admin:
    case DropdownRole.Editor:
      return { write: true }
    case DropdownRole.Viewer:
      return { write: false }
  }
}
