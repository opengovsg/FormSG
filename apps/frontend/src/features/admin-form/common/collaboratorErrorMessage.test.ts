import { HttpError } from '~services/ApiService'

import {
  FormCollaboratorAction,
  getMappedCollaboratorErrorMessage,
} from './collaboratorErrorMessage'

describe('getMappedCollaboratorErrorMessage', () => {
  it.each([
    ['add collaborator', FormCollaboratorAction.ADD],
    ['update collaborator', FormCollaboratorAction.UPDATE],
    ['remove collaborator', FormCollaboratorAction.REMOVE],
    ['remove self', FormCollaboratorAction.REMOVE_SELF],
  ])(
    'returns backend-provided 422 messages for %s',
    (_label: string, action: FormCollaboratorAction) => {
      const error = new HttpError('Mock backend 422 error', 422)

      expect(getMappedCollaboratorErrorMessage(error, action)).toBe(
        'Mock backend 422 error',
      )
    },
  )

  it.each([
    [
      'add collaborator',
      FormCollaboratorAction.ADD,
      'Error adding collaborator. Please refresh and try again.',
    ],
    [
      'update collaborator',
      FormCollaboratorAction.UPDATE,
      'Error updating collaborator. Please refresh and try again.',
    ],
    [
      'remove collaborator',
      FormCollaboratorAction.REMOVE,
      'Error removing collaborator. Please refresh and try again.',
    ],
    [
      'remove self',
      FormCollaboratorAction.REMOVE_SELF,
      'Error removing self. Please refresh and try again.',
    ],
  ])(
    'returns action-specific 422 fallback messages for %s',
    (
      _label: string,
      action: FormCollaboratorAction,
      expectedMessage: string,
    ) => {
      const error = new HttpError('', 422)

      expect(getMappedCollaboratorErrorMessage(error, action)).toBe(
        expectedMessage,
      )
    },
  )
})
