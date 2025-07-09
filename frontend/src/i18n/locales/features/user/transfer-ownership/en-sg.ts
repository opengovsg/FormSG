import { TransferOwnership } from '.'

export const enSG: TransferOwnership = {
  header: 'Transfer all forms',
  form: {
    label: 'Transfer ownership of all forms',
    description:
      'Share your secret key with this user for them to access response data',
    button: 'Transfer ownership',
  },
  confirmation: {
    transferringTo: 'You are transferring all forms to',
    loseAccessWarning:
      'You will be removed as a collaborator and lose access to the forms you previously owned',
    button: 'Yes, transfer all forms',
  },
}
