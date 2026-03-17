import { WorkspaceValidation } from '.'

export const enSG: WorkspaceValidation = {
  required: 'Folder name is required',
  maxLength: 'Folder name should contain less than {maxTitleLength} characters',
  specialCharacterPattern: 'Folder name should not contain special characters',
  minLength: 'Folder name should contain more than {minTitleLength} characters',
}
