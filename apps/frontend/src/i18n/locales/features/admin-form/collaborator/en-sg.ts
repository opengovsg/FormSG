import { Collaborator } from '.'

export const enSG: Collaborator = {
  list: {
    header: {
      manage: 'Manage collaborators',
      view: 'Collaborators',
    },
    removeButton: {
      ariaLabel: 'Remove collaborator',
    },
  },
  addInput: {
    label: 'Add collaborators or transfer form ownership',
    description:
      'Share your secret key with users who need to access response data',
    email: {
      placeholder: 'me@example.com',
    },
    errors: {
      required: 'Collaborator email is required',
      invalidEmail: 'Please enter a valid email',
      duplicate: 'This user is an existing collaborator. Edit role below.',
      ownerEmail: 'You cannot add the form owner as a collaborator',
    },
    button: {
      add: 'Add collaborator',
      transfer: 'Transfer form ownership',
    },
  },
  transferOwnership: {
    header: 'Transfer form ownership',
    message:
      'You are transferring this form to <email>{{email}}</email>. You will lose form ownership and the right to delete this form. You will still have Editor rights.',
    button: {
      confirm: 'Yes, transfer form',
    },
  },
  removeSelf: {
    header: 'Remove myself as collaborator',
    message:
      'You are removing yourself as a collaborator and will lose all access to this form. This action cannot be undone.',
    button: {
      confirm: 'Yes, remove myself',
    },
  },
  roles: {
    owner: 'Owner',
    editor: 'Editor',
    viewer: 'Viewer',
  },
}
