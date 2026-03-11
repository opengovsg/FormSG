export interface Collaborator {
  list: {
    header: {
      manage: string
      view: string
    }
    removeButton: {
      ariaLabel: string
    }
  }
  addInput: {
    label: string
    description: string
    email: {
      placeholder: string
    }
    errors: {
      required: string
      invalidEmail: string
      duplicate: string
      ownerEmail: string
    }
    button: {
      add: string
      transfer: string
    }
  }
  transferOwnership: {
    header: string
    message: string
    button: {
      confirm: string
    }
  }
  removeSelf: {
    header: string
    message: string
    button: {
      confirm: string
    }
  }
  roles: {
    owner: string
    editor: string
    viewer: string
  }
}

export { enSG } from './en-sg'
