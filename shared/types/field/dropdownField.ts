import { BasicField, MyInfoableFieldBase } from './base'

export interface DropdownFieldBase extends MyInfoableFieldBase {
  fieldType: BasicField.Dropdown
  fieldOptions: string[]
  // Note: `optionsToRecipientsMap` is attached to the field instead of MRF workflow step to:
  // 1. Allow immediate assignment without requiring step creation
  // (since step might not be created yet at the point of map assignment, leading to UX issues)
  // 2. Prevent orphaned mappings if field is deleted
  optionsToRecipientsMap?: Record<string, string[]>
}
