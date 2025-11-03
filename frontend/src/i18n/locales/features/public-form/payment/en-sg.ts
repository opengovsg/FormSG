import { Payment } from '.'

export const enSG: Payment = {
  modal: {
    header: 'You are about to make payment',
    body: 'Please ensure that your form information is accurate. You will not be able to edit your form after you proceed.',
    buttons: {
      cancel: 'Cancel',
      proceed: 'Proceed to pay',
      submitting: 'Submitting',
    },
  },
  summary: {
    total: 'Total:',
  },
  quantityModal: {
    header: 'Update quantity',
    buttons: {
      update: 'Update',
      saving: 'Saving',
      increment: 'Increment',
      decrement: 'Decrement',
    },
    errors: {
      minQuantity: 'Minimum quantity is {minQty}',
      wholeNumber: 'Please enter a whole number',
      maxQuantity: 'Maximum quantity is {maxQty}',
    },
  },
  productCard: {
    quantity: 'Qty: {quantity}',
    change: 'Change',
  },
  error: {
    header: 'There was an error preparing the payment.',
    body: 'For assistance, share the response ID with the agency that gave you the form link. No payment has been taken.',
    responseId: 'Response ID: {submissionId}',
    ariaLabel:
      'Error preparing payment for {formTitle}. Please contact the form creator for assistance and provide them the Response ID: {submissionId}.',
    ariaLabelNoTitle:
      'Error preparing payment. Please contact the form creator for assistance and provide them the Response ID: {submissionId}.',
  },
}
